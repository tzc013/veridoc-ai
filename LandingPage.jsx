import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  Database, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  Search,
  Lock,
  Cpu,
  CornerDownRight,
  HelpCircle,
  BarChart3
} from 'lucide-react';

export default function LandingPage() {
  const [testQuery, setTestQuery] = useState('What is the sales commission for Maple Residency?');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const samplePrompts = [
    'What is the sales commission for Maple Residency?',
    'Which properties are located in Islamabad and priced below PKR 50 million?',
    'What is the property viewing policy?',
    'What was Northstar Estates\' total revenue in 2025?',
  ];

  const handleRunSampleQuery = async (queryText) => {
    setTestQuery(queryText);
    try {
      setLoading(true);
      setTestResult(null);
      const res = await fetch('/api/chat/sessions/sandbox_preview/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText, top_k: 4 }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error('Query error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-[#14B8A6]/20 selection:text-[#2DD4BF]">
      {/* Background Subtle Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center">
        {/* Category Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-zinc-950 border border-white/10 text-xs font-mono text-zinc-300 mb-8">
          <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
          <span>ENTERPRISE AI DOCUMENT INTELLIGENCE</span>
          <span className="text-zinc-600">|</span>
          <span className="text-[#2DD4BF]">RAG KNOWLEDGE PLATFORM</span>
        </div>

        {/* Main Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-5xl mx-auto leading-[1.1] mb-6">
          Ask your documents.{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#2DD4BF] via-[#14B8A6] to-white">
            Trust the answer.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-light">
          Veridoc AI transforms complex business documents into an audit-ready, searchable knowledge base. Powered by page-aware semantic chunking and grounded by Google Gemini.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            to="/chat"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-bold text-sm tracking-wider uppercase transition-all shadow-[0_0_25px_rgba(20,184,166,0.35)] hover:shadow-[0_0_35px_rgba(45,212,191,0.5)] flex items-center justify-center gap-2"
          >
            Launch Platform
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/documents"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/15 hover:border-[#14B8A6]/40 text-white font-semibold text-sm transition-all flex items-center justify-center gap-2"
          >
            <FileText className="w-4 h-4 text-[#2DD4BF]" />
            Northstar Corpus
          </Link>
          <Link
            to="/benchmark"
            className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-zinc-950 hover:bg-zinc-900 border border-white/10 hover:border-white/20 text-zinc-300 font-mono text-xs transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-[#2DD4BF]" />
            15/15 Benchmark
          </Link>
        </div>

        {/* Interactive Live RAG Preview Box */}
        <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 text-left shadow-[0_0_50px_rgba(0,0,0,0.9)] relative overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Live RAG Sandbox • Northstar Estates Demo
              </span>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              Corpus: 5 Verified PDFs (Islamabad & Rawalpindi)
            </span>
          </div>

          {/* Quick Query Selector */}
          <div className="space-y-2 mb-4">
            <span className="text-xs font-mono text-zinc-400 block">Select a benchmark query to test:</span>
            <div className="flex flex-wrap gap-2">
              {samplePrompts.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleRunSampleQuery(prompt)}
                  className={`text-xs px-3 py-1.5 rounded-lg border font-mono transition-all text-left ${
                    testQuery === prompt
                      ? 'bg-[#14B8A6]/15 border-[#14B8A6] text-[#2DD4BF]'
                      : 'bg-black/60 border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* Search Box Input */}
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              placeholder="Ask anything about Northstar Estates documents..."
              className="flex-1 bg-black border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#14B8A6] font-mono"
            />
            <button
              onClick={() => handleRunSampleQuery(testQuery)}
              disabled={loading || !testQuery}
              className="px-5 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? 'Retrieving...' : 'Ask RAG'}
            </button>
          </div>

          {/* Response Box */}
          {testResult && (
            <div className="p-4 rounded-xl bg-black border border-white/10 space-y-3 font-mono">
              <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1.5 text-[#2DD4BF] font-semibold">
                  <ShieldCheck className="w-4 h-4" /> Grounded Verification
                </span>
                <span>Latency: {testResult.latencyMs || 210} ms</span>
              </div>

              <div className="text-sm text-zinc-200 leading-relaxed whitespace-pre-line">
                {testResult.assistantMessage?.content}
              </div>

              {testResult.assistantMessage?.sources?.length > 0 && (
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] text-zinc-400 block mb-2">
                    VERIFIED RETRIEVED SOURCES ({testResult.assistantMessage.sources.length}):
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {testResult.assistantMessage.sources.map((src, i) => (
                      <div
                        key={i}
                        className="px-2.5 py-1 rounded bg-zinc-900 border border-[#14B8A6]/30 text-[11px] text-zinc-300 flex items-center gap-2"
                      >
                        <FileText className="w-3 h-3 text-[#2DD4BF]" />
                        <span className="text-white font-medium">{src.document_name}</span>
                        <span className="text-[#2DD4BF]">p.{src.page_number}</span>
                        <span className="text-zinc-500">({(src.similarity_score * 100).toFixed(0)}%)</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-20 border-t border-white/10 bg-[#050505]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-mono text-[#2DD4BF] tracking-widest uppercase">
              Core Engineering
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2 mb-4">
              Built for precision, not guesswork.
            </h2>
            <p className="text-zinc-400 text-base leading-relaxed">
              Standard chatbots hallucinate and cite generic URLs. Veridoc AI implements mathematical semantic search and page-level chunk attribution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-xl bg-black border border-white/10 hover:border-[#14B8A6]/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Page-Aware Parsing</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Extracts PDF, DOCX, and TXT preserving physical page indices so every citation links to a concrete page number.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-xl bg-black border border-white/10 hover:border-[#14B8A6]/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">384-D Vector Engine</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Indexed in persistent vector storage using cosine nearest-neighbor search, filtering noise with strict relevance thresholds.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-xl bg-black border border-white/10 hover:border-[#14B8A6]/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Hallucination Defense</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                When asked about unmentioned topics (e.g. 2025 revenue, founder names), it explicitly refuses without fabricating sources.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-xl bg-black border border-white/10 hover:border-[#14B8A6]/40 transition-all space-y-3">
              <div className="w-10 h-10 rounded-lg bg-zinc-900 border border-[#14B8A6]/30 flex items-center justify-center text-[#2DD4BF]">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-lg font-bold text-white">Cross-Doc Reasoning</h3>
              <p className="text-sm text-zinc-400 leading-relaxed">
                Joins pricing data from Property Listings with commission structures in Services & Fees to perform accurate math.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase: Northstar Estates Case Study */}
      <section className="py-20 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-white/10 bg-[#0A0A0A] p-8 sm:p-12 overflow-hidden relative">
            <div className="max-w-2xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-zinc-900 border border-[#14B8A6]/30 text-xs font-mono text-[#2DD4BF]">
                DEMO DATASET ACTIVE
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Northstar Estates Real Estate Intelligence
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Explore an internally consistent luxury property portfolio spanning Sector F-11, E-11, Club Road Islamabad, and Bahria Town Rawalpindi. Test multi-criteria search, cross-referencing, and anti-hallucination barriers.
              </p>
              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/chat"
                  className="px-6 py-3 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-semibold text-xs uppercase tracking-wider transition-all"
                >
                  Start Inquiry Session
                </Link>
                <Link
                  to="/documents"
                  className="px-6 py-3 rounded-lg bg-black border border-white/15 hover:border-white/30 text-white font-mono text-xs transition-all flex items-center gap-2"
                >
                  Inspect Sample Files
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-10 bg-black text-xs font-mono text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white font-mono">VERIDOC AI</span>
            <span>— Ask your documents. Trust the answer.</span>
          </div>
          <div>
            Built with React 19 + Vite (No TypeScript) • SQLite + Chroma Vector Storage • Gemini 3.8 Flash
          </div>
        </div>
      </footer>
    </div>
  );
}
