import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Sparkles, 
  MessageSquare, 
  Plus, 
  Trash2, 
  FileText, 
  ShieldCheck, 
  Copy, 
  Check, 
  Clock, 
  Filter, 
  AlertCircle,
  HelpCircle,
  ArrowRight
} from 'lucide-react';
import SourceInspector from '../components/SourceInspector.jsx';

export default function ChatPage() {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedSource, setSelectedSource] = useState(null);
  const [copiedMsgId, setCopiedMsgId] = useState(null);
  const [documentFilter, setDocumentFilter] = useState('');
  const [availableDocs, setAvailableDocs] = useState([]);

  const messagesEndRef = useRef(null);

  const suggestedQuestions = [
    'What is the sales commission for Maple Residency?',
    'Which properties are located in Islamabad and priced below PKR 50 million?',
    'What is the property viewing policy?',
    'Compare Maple Residency and Cedar Heights',
    'What was Northstar Estates\' total revenue in 2025?',
  ];

  // Load sessions and documents
  useEffect(() => {
    fetchSessions();
    fetch('/api/documents')
      .then((res) => res.json())
      .then((data) => setAvailableDocs(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  // When active session changes, load messages
  useEffect(() => {
    if (currentSessionId) {
      fetchSessionDetails(currentSessionId);
    }
  }, [currentSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/chat/sessions');
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setSessions(list);
      if (list.length > 0 && !currentSessionId) {
        setCurrentSessionId(list[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch chat sessions:', err);
    }
  };

  const fetchSessionDetails = async (id) => {
    try {
      const res = await fetch(`/api/chat/sessions/${id}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (err) {
      console.error('Failed to fetch session messages:', err);
    }
  };

  const handleCreateSession = async () => {
    try {
      const res = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Document Inquiry' }),
      });
      const data = await res.json();
      setSessions([data, ...sessions]);
      setCurrentSessionId(data.id);
      setMessages([]);
      setSelectedSource(null);
    } catch (err) {
      console.error('Failed to create session:', err);
    }
  };

  const handleDeleteSession = async (id, e) => {
    e.stopPropagation();
    try {
      await fetch(`/api/chat/sessions/${id}`, { method: 'DELETE' });
      const remaining = sessions.filter((s) => s.id !== id);
      setSessions(remaining);
      if (currentSessionId === id) {
        if (remaining.length > 0) {
          setCurrentSessionId(remaining[0].id);
        } else {
          setCurrentSessionId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete session:', err);
    }
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const q = inputQuery.trim();
    if (!q || loading) return;

    let activeSession = currentSessionId;
    if (!activeSession) {
      // Create session first
      const sessionRes = await fetch('/api/chat/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: q.slice(0, 35) }),
      });
      const newSession = await sessionRes.json();
      activeSession = newSession.id;
      setCurrentSessionId(newSession.id);
      setSessions([newSession, ...sessions]);
    }

    // Optimistic user message
    const tempUserMsg = {
      id: 'temp_u_' + Date.now(),
      role: 'user',
      content: q,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputQuery('');
    setLoading(true);

    try {
      const res = await fetch(`/api/chat/sessions/${activeSession}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          top_k: 5,
          document_id: documentFilter || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate response');
      }

      const assistantMsg = {
        ...data.assistantMessage,
        latencyMs: data.latencyMs,
      };

      setMessages((prev) => [...prev.filter((m) => m.id !== tempUserMsg.id), data.userMessage, assistantMsg]);

      // Auto-open first source if available
      if (assistantMsg.sources && assistantMsg.sources.length > 0) {
        setSelectedSource(assistantMsg.sources[0]);
      }
      fetchSessions();
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          role: 'assistant',
          content: "I encountered an issue querying the knowledge base. Please verify the document indexing status.",
          created_at: new Date().toISOString(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-4rem)] bg-black text-white flex overflow-hidden">
      {/* 1. Left Column: Chat Sessions List */}
      <div className="w-64 border-r border-white/10 bg-[#050505] flex flex-col hidden md:flex shrink-0">
        {/* Session Header */}
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-mono text-zinc-400 font-bold uppercase tracking-wider">
            Inquiries
          </span>
          <button
            onClick={handleCreateSession}
            className="p-1.5 rounded-md bg-zinc-900 hover:bg-[#14B8A6] hover:text-black text-zinc-300 transition-all border border-white/10"
            title="New Session"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {sessions.length > 0 ? (
            sessions.map((s) => (
              <div
                key={s.id}
                onClick={() => setCurrentSessionId(s.id)}
                className={`group flex items-center justify-between p-2.5 rounded-lg text-xs font-mono cursor-pointer transition-all ${
                  currentSessionId === s.id
                    ? 'bg-zinc-900 border border-[#14B8A6]/40 text-[#2DD4BF]'
                    : 'text-zinc-400 hover:bg-zinc-900/50 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{s.title || 'Untitled Inquiry'}</span>
                </div>
                <button
                  onClick={(e) => handleDeleteSession(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-red-400 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-zinc-600 text-xs font-mono">
              No previous inquiries.
            </div>
          )}
        </div>

        {/* Document Filter in Sidebar */}
        <div className="p-3 border-t border-white/10 bg-black/50 text-xs font-mono">
          <label className="text-[10px] text-zinc-500 block mb-1 uppercase">Corpus Filter</label>
          <select
            value={documentFilter}
            onChange={(e) => setDocumentFilter(e.target.value)}
            className="w-full bg-zinc-900 border border-white/10 rounded px-2 py-1 text-xs text-zinc-300 focus:outline-none focus:border-[#14B8A6]"
          >
            <option value="">All Documents (Full RAG)</option>
            {availableDocs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.original_filename}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Center Column: Conversation Feed */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-black">
        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-4xl mx-auto w-full">
          {messages.length === 0 ? (
            <div className="pt-12 pb-6 space-y-6 text-center">
              <div className="w-12 h-12 rounded-xl bg-[#0A0A0A] border border-[#14B8A6]/40 flex items-center justify-center text-[#2DD4BF] mx-auto shadow-[0_0_25px_rgba(20,184,166,0.2)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-2">
                <h2 className="text-xl font-bold text-white font-mono">
                  Grounded Document Intelligence
                </h2>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Ask factual questions across Northstar Estates property listings, commission schedules, FAQs, and reservation policies.
                </p>
              </div>

              {/* Prompt Suggestions */}
              <div className="max-w-lg mx-auto pt-4 text-left space-y-2">
                <span className="text-[11px] font-mono text-zinc-500 block text-center uppercase tracking-wider">
                  Suggested Questions
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {suggestedQuestions.map((q) => (
                    <button
                      key={q}
                      onClick={() => {
                        setInputQuery(q);
                      }}
                      className="p-2.5 rounded-lg bg-[#0A0A0A] border border-white/10 hover:border-[#14B8A6]/40 text-xs font-mono text-zinc-300 hover:text-white transition-all text-left flex items-center justify-between group"
                    >
                      <span className="truncate">{q}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-[#2DD4BF] shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                {msg.role === 'user' ? (
                  // User Message
                  <div className="max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl rounded-tr-none px-4 py-3 text-sm text-white font-mono shadow-sm">
                    {msg.content}
                  </div>
                ) : (
                  // Assistant Message
                  <div className="max-w-3xl w-full bg-[#0A0A0A] border border-white/10 rounded-2xl rounded-tl-none p-5 text-sm text-zinc-200 font-mono space-y-3.5 shadow-[0_0_20px_rgba(0,0,0,0.5)]">
                    {/* Header */}
                    <div className="flex items-center justify-between text-xs text-zinc-500 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#2DD4BF]" />
                        <span className="font-bold text-white tracking-wider">VERIDOC GROUNDED ANSWER</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {msg.latencyMs && (
                          <span className="flex items-center gap-1 text-[11px] text-zinc-500">
                            <Clock className="w-3 h-3" /> {msg.latencyMs}ms
                          </span>
                        )}
                        <button
                          onClick={() => handleCopy(msg.content, msg.id)}
                          className="hover:text-white transition-colors"
                          title="Copy Answer"
                        >
                          {copiedMsgId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-[#2DD4BF]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="text-zinc-200 leading-relaxed whitespace-pre-wrap select-text text-xs sm:text-sm">
                      {msg.content}
                    </div>

                    {/* Sources Badge Row */}
                    {msg.sources && msg.sources.length > 0 ? (
                      <div className="pt-2 border-t border-white/5">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block mb-2">
                          Retrieved Sources (Click to inspect chunk):
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {msg.sources.map((src, i) => (
                            <button
                              key={i}
                              onClick={() => setSelectedSource(src)}
                              className={`px-2.5 py-1 rounded border text-[11px] flex items-center gap-1.5 transition-all ${
                                selectedSource?.chunk_id === src.chunk_id
                                  ? 'bg-[#14B8A6]/20 border-[#14B8A6] text-[#2DD4BF]'
                                  : 'bg-black border-white/10 hover:border-[#14B8A6]/50 text-zinc-300'
                              }`}
                            >
                              <FileText className="w-3 h-3 text-[#14B8A6]" />
                              <span className="font-medium text-white truncate max-w-[140px]">
                                {src.document_name}
                              </span>
                              <span className="text-[#2DD4BF] font-semibold">p.{src.page_number}</span>
                              <span className="text-zinc-500 text-[10px]">
                                ({(src.similarity_score * 100).toFixed(0)}%)
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="pt-1 text-[11px] text-zinc-500 italic">
                        No external sources cited. Answer strictly confined to negative refusal.
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Loading Indicator */}
          {loading && (
            <div className="flex items-center gap-3 p-4 rounded-xl bg-[#0A0A0A] border border-white/10 w-fit font-mono text-xs text-zinc-400 animate-pulse">
              <Sparkles className="w-4 h-4 text-[#2DD4BF] animate-spin" />
              <span>Querying vector space & grounding answer with Gemini...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-white/10 bg-[#050505]">
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ask a factual question about Northstar Estates documents..."
              disabled={loading}
              className="flex-1 bg-black border border-white/15 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6] font-mono transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              className="p-3 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(20,184,166,0.3)]"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* 3. Right Column: Source Inspector Drawer */}
      {selectedSource && (
        <SourceInspector
          source={selectedSource}
          onClose={() => setSelectedSource(null)}
        />
      )}
    </div>
  );
}
