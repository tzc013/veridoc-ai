// frontend/src/hooks/useChat.js
/**
 * Veridoc AI - Chat Hooks
 * Custom hooks for chat functionality
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import api from '../services/api';

// ============================================================================
// MAIN HOOK
// ============================================================================

export const useChat = (sessionId = null, options = {}) => {
  const queryClient = useQueryClient();
  const messagesEndRef = useRef(null);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [typingIndicator, setTypingIndicator] = useState(false);

  const {
    autoFetch = true,
    staleTime = 60 * 1000, // 1 minute
  } = options;

  // ==========================================================================
  // QUERIES
  // ==========================================================================

  // Get all chat sessions
  const {
    data: sessions = [],
    isLoading: isLoadingSessions,
    refetch: refetchSessions,
  } = useQuery({
    queryKey: ['chat-sessions'],
    queryFn: () => api.chat.getSessions(),
    staleTime,
    enabled: autoFetch,
    retry: 2,
    onError: (error) => {
      console.error('Failed to fetch chat sessions:', error);
    },
  });

  // Get specific session
  const {
    data: session = null,
    isLoading: isLoadingSession,
    refetch: refetchSession,
    isFetching: isFetchingSession,
  } = useQuery({
    queryKey: ['chat-session', sessionId],
    queryFn: () => api.chat.getSession(sessionId),
    enabled: !!sessionId && autoFetch,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: (data) => {
      // Refetch if there are new messages
      if (data?.messages && data.messages.length > 0) {
        const lastMessage = data.messages[data.messages.length - 1];
        const now = Date.now() / 1000;
        if (now - lastMessage.created_at < 300) { // Last 5 minutes
          return 5000; // Every 5 seconds
        }
      }
      return false;
    },
    onError: (error) => {
      console.error('Failed to fetch chat session:', error);
    },
  });

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================

  // Create new session
  const createSessionMutation = useMutation({
    mutationFn: (data) => api.chat.createSession(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chat-sessions']);
      toast.success('New chat session created');
    },
    onError: (error) => {
      toast.error(`Failed to create session: ${error.message}`);
    },
  });

  // Delete session
  const deleteSessionMutation = useMutation({
    mutationFn: (id) => api.chat.deleteSession(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries(['chat-sessions']);
      queryClient.removeQueries(['chat-session', id]);
      toast.success('Chat session deleted');
    },
    onError: (error) => {
      toast.error(`Failed to delete session: ${error.message}`);
    },
  });

  // Update session
  const updateSessionMutation = useMutation({
    mutationFn: ({ id, data }) => api.chat.updateSession(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['chat-sessions']);
      queryClient.invalidateQueries(['chat-session', data.id]);
    },
    onError: (error) => {
      toast.error(`Failed to update session: ${error.message}`);
    },
  });

  // Send message
  const sendMessageMutation = useMutation({
    mutationFn: async ({ sessionId, question }) => {
      const response = await api.chat.sendMessage(sessionId, { question });
      return response;
    },
    onSuccess: (data, variables) => {
      // Invalidate session to get updated messages
      queryClient.invalidateQueries(['chat-session', variables.sessionId]);
      // Invalidate sessions list (for updated timestamps)
      queryClient.invalidateQueries(['chat-sessions']);
    },
    onError: (error) => {
      toast.error(`Failed to send message: ${error.message}`);
    },
  });

  // Send message with streaming
  const sendStreamingMessage = useCallback(async (question) => {
    if (!sessionId) {
      toast.error('No active chat session');
      return;
    }

    if (!question.trim()) {
      return;
    }

    setIsStreaming(true);
    setStreamingContent('');
    setInput('');

    try {
      // Add user message immediately
      const userMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: question,
        created_at: Date.now() / 1000,
        isTemp: true,
      };

      // Update session with user message
      queryClient.setQueryData(['chat-session', sessionId], (old) => {
        if (!old) return { messages: [userMessage] };
        return {
          ...old,
          messages: [...(old.messages || []), userMessage],
        };
      });

      // Stream response
      let fullContent = '';
      await api.chat.sendMessageStream(
        sessionId,
        { question },
        (chunk) => {
          if (chunk.content) {
            fullContent += chunk.content;
            setStreamingContent(fullContent);
          }
          if (chunk.done) {
            // Message complete
            const assistantMessage = {
              id: chunk.message_id || `msg-${Date.now()}`,
              role: 'assistant',
              content: fullContent,
              sources: chunk.sources || [],
              created_at: Date.now() / 1000,
            };

            // Update session with assistant message
            queryClient.setQueryData(['chat-session', sessionId], (old) => {
              if (!old) return { messages: [assistantMessage] };
              // Remove temp messages and add assistant message
              const messages = (old.messages || [])
                .filter(m => !m.isTemp)
                .concat([assistantMessage]);
              return {
                ...old,
                messages,
              };
            });

            queryClient.invalidateQueries(['chat-sessions']);
            setIsStreaming(false);
            setStreamingContent('');
          }
        }
      );
    } catch (error) {
      console.error('Streaming error:', error);
      toast.error(`Failed to send message: ${error.message}`);
      setIsStreaming(false);
      setStreamingContent('');
    }
  }, [sessionId, queryClient]);

  // ==========================================================================
  // SESSION MANAGEMENT
  // ==========================================================================

  const createSession = useCallback(async (data = {}) => {
    try {
      const result = await createSessionMutation.mutateAsync(data);
      return result;
    } catch (error) {
      console.error('Create session error:', error);
      throw error;
    }
  }, [createSessionMutation]);

  const deleteSession = useCallback(async (id) => {
    try {
      await deleteSessionMutation.mutateAsync(id);
    } catch (error) {
      console.error('Delete session error:', error);
      throw error;
    }
  }, [deleteSessionMutation]);

  const updateSession = useCallback(async (id, data) => {
    try {
      const result = await updateSessionMutation.mutateAsync({ id, data });
      return result;
    } catch (error) {
      console.error('Update session error:', error);
      throw error;
    }
  }, [updateSessionMutation]);

  // ==========================================================================
  // MESSAGE MANAGEMENT
  // ==========================================================================

  const sendMessage = useCallback(async (question) => {
    if (!sessionId) {
      toast.error('No active chat session');
      return;
    }

    if (!question.trim()) {
      return;
    }

    try {
      await sendMessageMutation.mutateAsync({ sessionId, question });
      setInput('');
    } catch (error) {
      console.error('Send message error:', error);
    }
  }, [sessionId, sendMessageMutation]);

  const clearMessages = useCallback(() => {
    // Create a new session to clear messages
    createSession({ title: session?.title || 'New Chat' });
  }, [session, createSession]);

  // ==========================================================================
  // DERIVED DATA
  // ==========================================================================

  const messages = useMemo(() => {
    if (!session) return [];
    return session.messages || [];
  }, [session]);

  const messageCount = useMemo(() => messages.length, [messages]);

  const lastMessage = useMemo(() => {
    if (messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [messages]);

  const hasMessages = messageCount > 0;

  // ==========================================================================
  // EFFECTS
  // ==========================================================================

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, streamingContent]);

  // Set streaming message in cache
  useEffect(() => {
    if (streamingContent && sessionId) {
      // Update the streaming message in the cache
      queryClient.setQueryData(['chat-session', sessionId], (old) => {
        if (!old) return old;
        const messages = old.messages || [];
        // Check if there's already a streaming message
        const hasStreaming = messages.some(m => m.isStreaming);
        if (hasStreaming) {
          // Update existing streaming message
          return {
            ...old,
            messages: messages.map(m => 
              m.isStreaming ? { ...m, content: streamingContent } : m
            ),
          };
        } else {
          // Add new streaming message
          const streamMessage = {
            id: `stream-${Date.now()}`,
            role: 'assistant',
            content: streamingContent,
            isStreaming: true,
            created_at: Date.now() / 1000,
          };
          return {
            ...old,
            messages: [...messages, streamMessage],
          };
        }
      });
    }
  }, [streamingContent, sessionId, queryClient]);

  // ==========================================================================
  // TYPING INDICATOR
  // ==========================================================================

  const showTyping = useCallback(() => {
    setTypingIndicator(true);
    const timer = setTimeout(() => {
      setTypingIndicator(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // ==========================================================================
  // GROUP SESSIONS BY DATE
  // ==========================================================================

  const groupedSessions = useMemo(() => {
    const groups = {};
    const now = Date.now() / 1000;
    const today = new Date().setHours(0, 0, 0, 0) / 1000;
    const yesterday = today - 86400;

    sessions.forEach(session => {
      const created = session.created_at || 0;
      let groupKey = 'Older';
      
      if (created >= today) {
        groupKey = 'Today';
      } else if (created >= yesterday) {
        groupKey = 'Yesterday';
      } else if (created >= today - 7 * 86400) {
        groupKey = 'This Week';
      } else if (created >= today - 30 * 86400) {
        groupKey = 'This Month';
      }
      
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(session);
    });

    // Sort groups by date
    const order = ['Today', 'Yesterday', 'This Week', 'This Month', 'Older'];
    const sortedGroups = {};
    order.forEach(key => {
      if (groups[key]) {
        sortedGroups[key] = groups[key];
      }
    });

    return sortedGroups;
  }, [sessions]);

  // ==========================================================================
  // RETURN
  // ==========================================================================

  return {
    // Sessions
    sessions,
    groupedSessions,
    session,
    isLoading: isLoadingSessions || isLoadingSession,
    isFetching: isFetchingSession,
    
    // Messages
    messages,
    messageCount,
    lastMessage,
    hasMessages,
    
    // Input
    input,
    setInput,
    
    // Actions
    createSession,
    deleteSession,
    updateSession,
    sendMessage,
    sendStreamingMessage,
    clearMessages,
    refetchSessions,
    refetchSession,
    showTyping,
    
    // States
    isStreaming,
    streamingContent,
    typingIndicator,
    isSending: sendMessageMutation.isPending,
    isCreating: createSessionMutation.isPending,
    isDeleting: deleteSessionMutation.isPending,
    isUpdating: updateSessionMutation.isPending,
    
    // Refs
    messagesEndRef,
  };
};

// ============================================================================
// EXPORT
// ============================================================================

export default useChat;