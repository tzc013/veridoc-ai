import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { getDb, queryAll, queryOne, runQuery } from '../db/database.js';
import { extractDocumentContent } from './extractionService.js';
import { chunkDocumentPages } from './chunkingService.js';
import { generateEmbedding } from './embeddingService.js';
import { addChunks, deleteDocumentVectors } from './vectorService.js';

export async function processDocument({ filePath, originalFilename, fileType, fileSize, existingId = null }) {
  const db = await getDb();
  const documentId = existingId || 'doc_' + crypto.randomUUID().slice(0, 8);
  const now = new Date().toISOString();

  // If new doc, create entry in SQLite
  if (!existingId) {
    runQuery(
      db,
      `INSERT INTO documents (id, filename, original_filename, file_type, file_size, status, page_count, chunk_count, error_message, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 'PROCESSING', 0, 0, NULL, ?, ?)`,
      [documentId, originalFilename, originalFilename, fileType, fileSize, now, now]
    );
  } else {
    runQuery(
      db,
      `UPDATE documents SET status = 'PROCESSING', error_message = NULL, updated_at = ? WHERE id = ?`,
      [now, documentId]
    );
    // Clear existing chunks & vectors
    runQuery(db, `DELETE FROM chunks WHERE document_id = ?`, [documentId]);
    deleteDocumentVectors(documentId);
  }

  try {
    // 1. Text Extraction
    const extractionResult = await extractDocumentContent(filePath, fileType);
    const { pages, pageCount } = extractionResult;

    if (!pages || pages.length === 0 || !extractionResult.fullText.trim()) {
      throw new Error('No readable text could be extracted from this document.');
    }

    // 2. Intelligent Chunking
    const chunks = chunkDocumentPages({
      documentId,
      documentName: originalFilename,
      pages,
      targetTokens: 850,
      overlapTokens: 120,
    });

    // 3. Generate Embeddings & Index into Vector Store
    const chunksWithVectors = [];
    for (const chk of chunks) {
      const emb = await generateEmbedding(chk.text);
      chunksWithVectors.push({
        ...chk,
        embedding: emb,
      });

      // Insert chunk into SQLite
      runQuery(
        db,
        `INSERT INTO chunks (id, document_id, chunk_index, page_number, text, created_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [chk.id, documentId, chk.chunk_index, chk.page_number, chk.text, now]
      );
    }

    await addChunks(chunksWithVectors);

    // 4. Update status to INDEXED
    runQuery(
      db,
      `UPDATE documents SET status = 'INDEXED', page_count = ?, chunk_count = ?, updated_at = ? WHERE id = ?`,
      [pageCount, chunks.length, new Date().toISOString(), documentId]
    );

    return {
      id: documentId,
      filename: originalFilename,
      status: 'INDEXED',
      page_count: pageCount,
      chunk_count: chunks.length,
    };
  } catch (err) {
    console.error(`[DocumentService] Processing failed for ${documentId}:`, err);
    runQuery(
      db,
      `UPDATE documents SET status = 'FAILED', error_message = ?, updated_at = ? WHERE id = ?`,
      [err.message || 'Processing failed', new Date().toISOString(), documentId]
    );
    throw err;
  }
}

export async function getAllDocuments() {
  const db = await getDb();
  return queryAll(db, `SELECT * FROM documents ORDER BY created_at DESC`);
}

export async function getDocumentById(id) {
  const db = await getDb();
  const doc = queryOne(db, `SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) return null;

  const chunks = queryAll(db, `SELECT id, chunk_index, page_number, text FROM chunks WHERE document_id = ? ORDER BY page_number ASC, chunk_index ASC`, [id]);
  return {
    ...doc,
    chunks,
  };
}

export async function deleteDocument(id) {
  const db = await getDb();
  const doc = queryOne(db, `SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) return false;

  // Delete vectors
  deleteDocumentVectors(id);

  // Delete from SQLite (cascades chunks)
  runQuery(db, `DELETE FROM chunks WHERE document_id = ?`, [id]);
  runQuery(db, `DELETE FROM documents WHERE id = ?`, [id]);

  // Clean uploaded file if exists
  const filePath = path.resolve(process.cwd(), 'data', 'uploads', doc.filename);
  if (fs.existsSync(filePath)) {
    try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  }

  return true;
}

export async function reprocessDocument(id) {
  const db = await getDb();
  const doc = queryOne(db, `SELECT * FROM documents WHERE id = ?`, [id]);
  if (!doc) throw new Error('Document not found');

  let filePath = path.resolve(process.cwd(), 'data', 'uploads', doc.filename);
  if (!fs.existsSync(filePath)) {
    // Check in sample-documents
    const samplePath = path.resolve(process.cwd(), 'sample-documents', doc.filename);
    if (fs.existsSync(samplePath)) {
      filePath = samplePath;
    } else {
      throw new Error('Original file binary not found on disk for reprocessing.');
    }
  }

  return await processDocument({
    filePath,
    originalFilename: doc.original_filename,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    existingId: doc.id,
  });
}
