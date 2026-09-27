import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  FileText, 
  MessageSquare, 
  LayoutDashboard, 
  CheckCircle2, 
  Database, 
  Sparkles,
  RefreshCw,
  Sliders
} from 'lucide-react';

export default function Navbar({ stats, onSeedRefresh }) {
  const location = useLocation();
  const [seeding, setSeeding] = useState(false);

  const handleSeed = async () => {
    try {
      setSeeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (onSeedRefresh) onSeedRefresh();
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  const navLinks = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/chat', label: 'Ask Documents', icon: MessageSquare },
    { path: '/benchmark', label: 'Evaluation', icon: CheckCircle2 },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-lg bg-[#0A0A0A] border border-[#14B8A6]/40 flex items-center justify-center text-[#2DD4BF] group-hover:border-[#14B8A6] group-hover:shadow-[0_0_15px_rgba(20,184,166,0.3)] transition-all">
              <Sparkles className="w-5 h-5 text-[#2DD4BF]" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-wider text-white flex items-center gap-1.5 font-mono">
                VERIDOC<span className="text-[#2DD4BF]">AI</span>
              </span>
              <span className="text-[10px] text-zinc-400 block tracking-widest uppercase -mt-1 font-mono">
                RAG Intelligence
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                    isActive
                      ? 'bg-zinc-900 text-[#2DD4BF] border border-[#14B8A6]/30'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#2DD4BF]' : 'text-zinc-400'}`} />
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Northstar Seed Trigger */}
          <button
            onClick={handleSeed}
            disabled={seeding}
            title="Re-index Northstar Estates sample documents"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono rounded bg-zinc-900 border border-white/10 hover:border-[#14B8A6]/50 text-zinc-300 hover:text-white transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3 h-3 text-[#2DD4BF] ${seeding ? 'animate-spin' : ''}`} />
            {seeding ? 'Seeding...' : 'Reset Northstar Docs'}
          </button>

          {/* System Status Pill */}
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-950 border border-white/10 text-xs font-mono">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse"></span>
            <span className="text-zinc-300 hidden sm:inline">Northstar Corpus:</span>
            <span className="text-[#2DD4BF] font-semibold">
              {stats?.totalDocuments ?? 5} Docs / {stats?.totalVectors ?? 9} Vectors
            </span>
          </div>

          <Link
            to="/chat"
            className="px-3.5 py-1.5 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-semibold text-xs tracking-wide uppercase transition-all shadow-[0_0_15px_rgba(20,184,166,0.25)] hover:shadow-[0_0_20px_rgba(45,212,191,0.4)]"
          >
            Ask AI
          </Link>
        </div>
      </div>
    </header>
  );
}
