import React, { useState, useRef } from 'react';
import { UploadCloud, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function DocumentUploadModal({ isOpen, onClose, onUploadSuccess }) {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const validateFile = (selectedFile) => {
    const validExtensions = ['.pdf', '.docx', '.txt'];
    const name = selectedFile.name.toLowerCase();
    const isValid = validExtensions.some((ext) => name.endsWith(ext));

    if (!isValid) {
      setError("This file type isn't supported. Please upload a PDF, DOCX, or TXT file.");
      return false;
    }

    if (selectedFile.size > 25 * 1024 * 1024) {
      setError('File size exceeds the 25MB limit.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (validateFile(droppedFile)) {
        setFile(droppedFile);
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (validateFile(selected)) {
        setFile(selected);
      }
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setUploading(true);
      setError(null);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload document');
      }

      if (onUploadSuccess) {
        onUploadSuccess(data.document);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-white/10 bg-[#0A0A0A] shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-[#2DD4BF]" />
            <h3 className="text-base font-semibold text-white">Ingest New Document</h3>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Dropzone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-[#14B8A6] bg-[#14B8A6]/10'
                : 'border-white/15 hover:border-[#14B8A6]/50 bg-black/50 hover:bg-black'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileChange}
            />

            <UploadCloud className="w-10 h-10 text-zinc-500 mx-auto mb-3" />
            <p className="text-sm font-medium text-white mb-1">
              Drag and drop your file here, or <span className="text-[#2DD4BF]">browse</span>
            </p>
            <p className="text-xs text-zinc-500">
              Supports PDF, DOCX, and TXT (Maximum file size: 25MB)
            </p>
          </div>

          {/* Selected File Card */}
          {file && (
            <div className="p-3.5 rounded-lg bg-black border border-[#14B8A6]/30 flex items-center justify-between">
              <div className="flex items-center gap-3 truncate">
                <FileText className="w-5 h-5 text-[#2DD4BF] shrink-0" />
                <div className="truncate">
                  <p className="text-sm font-medium text-white truncate font-mono">{file.name}</p>
                  <p className="text-xs text-zinc-500 font-mono">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                disabled={uploading}
                className="text-zinc-500 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/30 flex items-start gap-2.5 text-xs text-red-300">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Processing Steps Note */}
          <div className="text-[11px] text-zinc-500 space-y-1 font-mono">
            <p>Ingestion Pipeline:</p>
            <p className="text-zinc-400">1. Text extraction → 2. Page-aware chunking → 3. 384-d vector embeddings → 4. Vector index</p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-end gap-3 bg-black">
          <button
            onClick={onClose}
            disabled={uploading}
            className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-4 py-2 rounded-lg bg-[#14B8A6] hover:bg-[#2DD4BF] text-black font-semibold text-xs tracking-wide uppercase transition-all flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_15px_rgba(20,184,166,0.3)]"
          >
            {uploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {uploading ? 'Processing & Embedding...' : 'Ingest Document'}
          </button>
        </div>
      </div>
    </div>
  );
}
