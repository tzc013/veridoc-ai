// frontend/src/pages/Chat.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MessageSquare, Sparkles, Send, User, Plus, Trash2, FileText } from 'lucide-react';

const Chat = () => {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input, created_at: Date.now() / 1000 };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        role: 'assistant',
        content: 'I found information about that in your documents. Here are the details...\n\n• Maple Residency — PKR 42,000,000\n• Cedar Heights — PKR 46,500,000\n• Lakeview Apartments — PKR 49,500,000\n\nThese properties are all located in Islamabad.',
        created_at: Date.now() / 1000,
        sources: [
          { document_name: 'Property_Listings.pdf', page_number: 4 },
          { document_name: 'Property_Listings.pdf', page_number: 7 },
        ]
      };
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="h-[calc(100vh-12rem)] flex gap-6">
      {/* Session List */}
      <div className="w-64 flex-shrink-0 hidden lg:block">
        <div className="bg-surface-elevated border border-border rounded-xl h-full flex flex-col">
          <div className="p-4 border-b border-border">
            <button className="w-full px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors inline-flex items-center justify-center gap-2 text-sm font-medium">
              <Plus size={16} />
              New Chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-center py-8">
              <MessageSquare size={32} className="text-text-muted mx-auto mb-2" />
              <span className="text-sm text-text-muted">No chat sessions yet</span>
              <button className="block mx-auto mt-2 text-sm text-primary hover:text-primary-hover">
                Start a new chat
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Main Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="bg-surface-elevated border border-border rounded-xl flex-1 flex flex-col overflow-hidden">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Sparkles size={18} className="text-primary" />
              </div>
              <div>
                <span className="font-medium text-text-primary">Veridoc AI Assistant</span>
                <span className="text-xs text-text-muted block">Ask anything about your documents</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-success/10 text-success text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                Online
              </span>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center">
                <div className="p-6 rounded-full bg-primary/5 mb-4">
                  <Sparkles size={48} className="text-primary" />
                </div>
                <h3 className="text-xl font-semibold text-text-primary mb-2">How can I help you?</h3>
                <p className="text-text-muted max-w-md">Ask questions about your documents and I'll find the answers with sources.</p>
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-primary/30 transition-colors">
                    Find properties under 50M
                  </button>
                  <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-primary/30 transition-colors">
                    Check commission
                  </button>
                  <button className="px-4 py-2 bg-surface border border-border rounded-lg text-sm text-text-secondary hover:text-text-primary hover:border-primary/30 transition-colors">
                    Company services
                  </button>
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={16} className="text-primary" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                      msg.role === 'user'
                        ? 'bg-primary text-white rounded-br-sm'
                        : 'bg-surface border border-border rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/50">
                        <span className="text-xs text-text-muted block mb-2">Sources:</span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((source, si) => (
                            <span key={si} className="inline-flex items-center gap-1 px-2 py-1 bg-surface rounded text-xs text-text-muted border border-border">
                              <FileText size={12} />
                              {source.document_name}
                              {source.page_number && ` · p.${source.page_number}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <span className="text-xs text-text-muted mt-1 opacity-50 block text-right">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-surface border border-border flex items-center justify-center flex-shrink-0">
                      <User size={16} className="text-text-muted" />
                    </div>
                  )}
                </div>
              ))
            )}
            {isLoading && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-primary" />
                </div>
                <div className="bg-surface border border-border rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border flex-shrink-0">
            <div className="flex gap-2 items-end">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask your knowledge base..."
                className="flex-1 px-4 py-2.5 bg-surface border border-border rounded-lg text-text-primary placeholder-text-muted resize-none min-h-[48px] max-h-[150px] focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                rows={1}
                disabled={isLoading}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="px-4 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send size={20} />
              </button>
            </div>
            <div className="text-xs text-text-muted mt-2 text-center">
              Press Enter to send, Shift+Enter for new line
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;