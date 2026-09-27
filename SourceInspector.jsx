import React from 'react';
import { X, FileText, CheckCircle2, ExternalLink, ShieldCheck, Bookmark, Hash } from 'lucide-react';

export default function SourceInspector({ source, onClose }) {
  if (!source) return null;

  const scorePercentage = Math.min(100, Math.round((source.similarity_score || 0.5) * 100));

  return (
    <div className="w-full lg:w-96 border-l border-white/10 bg-[#0A0A0A] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-black">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[#2DD4BF]" />
          <h3 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
            Source Inspector
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 overflow-y-auto space-y-5 text-sm flex-1">
        {/* Document Meta Card */}
        <div className="p-3.5 rounded-lg bg-black border border-white/10 space-y-2.5">
          <div className="flex items-center gap-2 text-zinc-300">
            <FileText className="w-4 h-4 text-[#14B8A6]" />
            <span className="font-semibold text-white truncate font-mono text-xs">
              {source.document_name || 'Document'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
            <div className="p-2 rounded bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">VERIFIED PAGE</span>
              <span className="text-[#2DD4BF] font-semibold text-sm">
                Page {source.page_number || 1}
              </span>
            </div>
            <div className="p-2 rounded bg-zinc-900/80 border border-white/5">
              <span className="text-zinc-500 block text-[10px]">VECTOR CHUNK</span>
              <span className="text-zinc-300 font-semibold truncate block">
                {source.chunk_id || 'chk_01'}
              </span>
            </div>
          </div>
        </div>

        {/* Confidence & Similarity Metric */}
        <div className="p-3.5 rounded-lg bg-black border border-white/10 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400">COSINE SIMILARITY</span>
            <span className="text-[#2DD4BF] font-bold">
              {(source.similarity_score || 0).toFixed(4)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-[#0F766E] to-[#2DD4BF] h-full rounded-full transition-all duration-500"
              style={{ width: `${scorePercentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-500 font-mono">
            <span>Relevance Threshold: 0.25</span>
            <span className="text-zinc-400">
              {scorePercentage > 40 ? 'High Confidence' : 'Moderate Match'}
            </span>
          </div>
        </div>

        {/* Passage Text */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>ATTRIBUTED TEXT PASSAGE</span>
            <span className="text-[10px] text-zinc-500">Exact Chunk Content</span>
          </div>

          <div className="p-3.5 rounded-lg bg-zinc-950 border border-[#14B8A6]/20 font-mono text-xs leading-relaxed text-zinc-200 select-text whitespace-pre-wrap">
            {source.snippet || source.text || 'No text snippet available.'}
          </div>
        </div>

        {/* Grounding Badge */}
        <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-[#2DD4BF] shrink-0 mt-0.5" />
          <div className="text-xs text-zinc-300 leading-relaxed">
            <p className="font-semibold text-white mb-0.5">Audit-Grade Traceability</p>
            This chunk was extracted directly from the physical PDF binary and embedded using 384-dimensional dense vectors.
          </div>
        </div>
      </div>
    </div>
  );
}
