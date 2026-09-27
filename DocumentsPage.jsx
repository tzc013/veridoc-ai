import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Trash2, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  Filter,
  X,
  Layers,
  Database,
  Download
} from 'lucide-react';
import DocumentUploadModal from '../components/DocumentUploadModal.jsx';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [inspectingChunks, setInspectingChunks] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [reprocessingId, setReprocessingId] = useState(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  const handleInspect = async (doc) => {
    try {
      const res = await fetch(`/api/documents/${doc.id}`);
      const fullDoc = await res.json();
      setSelectedDoc(fullDoc);
      setInspectingChunks(true);
    } catch (err) {
      console.error('Failed to inspect document:', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document and purge all associated vector embeddings?')) return;
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      fetchDocs();
      if (selectedDoc?.id === id) {
        setSelectedDoc(null);
        setInspectingChunks(false);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleReprocess = async (id) => {
    try {
      setReprocessingId(id);
      await fetch(`/api/documents/${id}/reprocess`, { method: 'POST' });
      fetchDocs();
    } catch (err) {
      console.error('Reprocess error:', err);
    } finally {
      setReprocessingId(null);
    }
  };

  const filteredDocs = documents.filter((d) =>
    (d.original_filename || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBytes = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white font-mono">
            Document Intelligence Hub
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Manage your document knowledge base, chunking topologies, and vector indexes.
          </p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2.5 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-semibold text-xs uppercase tracking-wider transition-all flex items-center gap-2 shadow-[0_0_15px_rgba(20,184,166,0.3)] self-start sm:self-auto"
        >
          <UploadCloud className="w-4 h-4" />
          Ingest File
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents by name..."
            className="w-full bg-[#0A0A0A] border border-white/10 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#14B8A6] font-mono"
          />
        </div>
        <button
          onClick={fetchDocs}
          className="p-2 rounded-lg bg-[#0A0A0A] border border-white/10 text-zinc-400 hover:text-white transition-colors"
          title="Refresh List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Documents Grid / Table */}
      <div className="rounded-xl border border-white/10 bg-[#0A0A0A] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm font-mono">
            <thead className="bg-black/80 text-zinc-400 text-xs uppercase border-b border-white/10">
              <tr>
                <th className="py-3.5 px-4">Document Name</th>
                <th className="py-3.5 px-4">Format</th>
                <th className="py-3.5 px-4">File Size</th>
                <th className="py-3.5 px-4">Pages / Chunks</th>
                <th className="py-3.5 px-4">Vector Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-zinc-300 text-xs">
              {filteredDocs.length > 0 ? (
                filteredDocs.map((doc) => (
                  <tr key={doc.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="py-4 px-4 font-medium text-white flex items-center gap-3">
                      <div className="p-2 rounded bg-zinc-900 border border-white/10 text-[#14B8A6]">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-white">{doc.original_filename}</p>
                        <p className="text-[10px] text-zinc-500">{doc.id}</p>
                      </div>
                    </td>
                    <td className="py-4 px-4 uppercase text-zinc-400">
                      {doc.file_type.includes('pdf') ? 'PDF' : doc.file_type}
                    </td>
                    <td className="py-4 px-4 text-zinc-400">
                      {formatBytes(doc.file_size)}
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-[#2DD4BF] font-semibold">{doc.page_count}</span> pgs /{' '}
                      <span className="text-zinc-300 font-semibold">{doc.chunk_count}</span> chunks
                    </td>
                    <td className="py-4 px-4">
                      {doc.status === 'INDEXED' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-[#2DD4BF] border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> INDEXED
                        </span>
                      ) : doc.status === 'PROCESSING' || reprocessingId === doc.id ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-amber-950/60 text-amber-400 border border-amber-500/30">
                          <RefreshCw className="w-3 h-3 animate-spin" /> PROCESSING
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-red-950/60 text-red-400 border border-red-500/30">
                          <AlertCircle className="w-3 h-3" /> FAILED
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleInspect(doc)}
                          className="px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-[11px] border border-white/10 flex items-center gap-1"
                          title="Inspect chunks"
                        >
                          <Eye className="w-3 h-3 text-[#2DD4BF]" />
                          Inspect
                        </button>
                        <button
                          onClick={() => handleReprocess(doc.id)}
                          disabled={reprocessingId === doc.id}
                          className="p-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-white/10 disabled:opacity-50"
                          title="Reprocess document"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${reprocessingId === doc.id ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 rounded bg-zinc-900 hover:bg-red-950/50 hover:text-red-400 text-zinc-400 border border-white/10"
                          title="Delete document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-zinc-500">
                    No matching documents found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chunk Inspector Slide-Over / Modal */}
      {inspectingChunks && selectedDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-3xl max-h-[85vh] rounded-xl border border-white/10 bg-[#0A0A0A] flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.9)]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black">
              <div className="flex items-center gap-2.5">
                <Layers className="w-5 h-5 text-[#2DD4BF]" />
                <div>
                  <h3 className="text-sm font-bold text-white font-mono">{selectedDoc.original_filename}</h3>
                  <p className="text-[11px] text-zinc-400 font-mono">
                    {selectedDoc.page_count} Pages • {selectedDoc.chunks?.length || 0} Chunks in Vector Index
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingChunks(false)}
                className="p-1 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chunks List */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedDoc.chunks && selectedDoc.chunks.length > 0 ? (
                selectedDoc.chunks.map((chk, idx) => (
                  <div
                    key={chk.id}
                    className="p-4 rounded-lg bg-black border border-white/10 space-y-2 hover:border-[#14B8A6]/40 transition-all font-mono"
                  >
                    <div className="flex items-center justify-between text-xs text-zinc-400 border-b border-white/5 pb-2">
                      <span className="flex items-center gap-2">
                        <span className="text-[#2DD4BF] font-semibold">Chunk #{idx + 1}</span>
                        <span className="text-zinc-600">|</span>
                        <span>Page {chk.page_number}</span>
                      </span>
                      <span className="text-[10px] text-zinc-500">{chk.id}</span>
                    </div>
                    <div className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap select-text">
                      {chk.text}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-zinc-500 py-8 text-xs font-mono">
                  No chunk details found for this document.
                </p>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-black flex justify-end">
              <button
                onClick={() => setInspectingChunks(false)}
                className="px-4 py-1.5 rounded bg-zinc-900 hover:bg-zinc-800 text-xs font-mono text-zinc-300"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      <DocumentUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={fetchDocs}
      />
    </div>
  );
}
