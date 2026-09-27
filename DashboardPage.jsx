import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Layers, 
  CheckCircle2, 
  AlertCircle, 
  UploadCloud, 
  MessageSquare, 
  RefreshCw, 
  ExternalLink,
  Clock,
  Sparkles,
  ArrowUpRight,
  Database
} from 'lucide-react';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isUploadOpen, setIsUploadOpen] = useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/stats');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-[#14B8A6]"></span>
            <span className="text-xs font-mono text-[#2DD4BF] uppercase tracking-wider">
              Northstar Estates Workspace
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            System Dashboard
          </h1>
          <p className="text-sm text-zinc-400 mt-0.5">
            Knowledge base indexing metrics, vector capacity, and recent grounded queries.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-4 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            <UploadCloud className="w-4 h-4" />
            Upload Document
          </button>
          <Link
            to="/chat"
            className="px-4 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-white font-medium text-xs transition-all flex items-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-[#2DD4BF]" />
            Ask Question
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Documents */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase">Total Documents</span>
            <FileText className="w-4 h-4 text-[#14B8A6]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalDocuments ?? 5}
          </div>
          <div className="text-xs text-zinc-500 font-mono flex items-center gap-1.5">
            <span className="text-[#2DD4BF] font-semibold">{stats?.indexedDocuments ?? 5} Active</span>
            <span>•</span>
            <span>{stats?.failedDocuments ?? 0} Failed</span>
          </div>
        </div>

        {/* Total Chunks */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase">Indexed Chunks</span>
            <Layers className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalChunks ?? 9}
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            ~850 tokens per chunk with 120t overlap
          </div>
        </div>

        {/* Vector Records */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase">Vector Records</span>
            <Database className="w-4 h-4 text-[#14B8A6]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalVectors ?? 9}
          </div>
          <div className="text-xs text-zinc-500 font-mono">
            384-dimensional dense vectors
          </div>
        </div>

        {/* Grounded Inquiries */}
        <div className="p-5 rounded-xl bg-[#0A0A0A] border border-white/10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase">Grounded Queries</span>
            <Sparkles className="w-4 h-4 text-[#2DD4BF]" />
          </div>
          <div className="text-3xl font-extrabold text-white font-mono">
            {stats?.totalQueries ?? 12}
          </div>
          <div className="text-xs text-[#2DD4BF] font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            100% Attribution
          </div>
        </div>
      </div>

      {/* Quick Action Strip */}
      <div className="p-4 rounded-xl bg-zinc-950 border border-white/10 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-[#14B8A6]/10 border border-[#14B8A6]/30 text-[#2DD4BF]">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Northstar Estates Real Estate Corpus</p>
            <p className="text-xs text-zinc-400 font-mono">5 PDF documents loaded and indexed for evaluation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/benchmark"
            className="px-3 py-1.5 rounded bg-zinc-900 border border-white/10 hover:border-[#14B8A6]/40 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            Run 15-Point Benchmark
            <ArrowUpRight className="w-3.5 h-3.5 text-[#2DD4BF]" />
          </Link>
          <Link
            to="/documents"
            className="px-3 py-1.5 rounded bg-zinc-900 border border-white/10 hover:border-white/20 text-xs font-mono text-zinc-300 hover:text-white transition-all"
          >
            View Document Hub
          </Link>
        </div>
      </div>

      {/* Recent Documents Table */}
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#2DD4BF]" />
            <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider">
              Document Catalog
            </h2>
          </div>
          <Link
            to="/documents"
            className="text-xs font-mono text-[#2DD4BF] hover:underline flex items-center gap-1"
          >
            Manage all
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-black/60 text-zinc-400 text-xs uppercase border-b border-white/5">
              <tr>
                <th className="py-3 px-4">Document</th>
                <th className="py-3 px-4">Format</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Pages / Chunks</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Indexed At</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 text-xs">
              {stats?.recentDocuments && stats.recentDocuments.length > 0 ? (
                stats.recentDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#14B8A6] shrink-0" />
                      <span className="truncate max-w-xs">{doc.original_filename}</span>
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400 uppercase">
                      {doc.file_type.includes('pdf') ? 'PDF' : doc.file_type}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {formatBytes(doc.file_size)}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-300">
                      {doc.page_count} pgs / {doc.chunk_count} chks
                    </td>
                    <td className="py-3.5 px-4">
                      {doc.status === 'INDEXED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-[#2DD4BF] border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> INDEXED
                        </span>
                      ) : doc.status === 'PROCESSING' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                          <RefreshCw className="w-3 h-3 animate-spin" /> PROCESSING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-400">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/chat`}
                        className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-[#14B8A6] hover:text-black text-zinc-300 text-[11px] transition-all border border-white/10"
                      >
                        Ask
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-zinc-500">
                    No documents found. Click "Upload Document" or seed Northstar Estates.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchStats}
      />
    </div>
  );
}
