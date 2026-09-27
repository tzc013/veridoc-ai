import fs from 'fs';
import path from 'path';
import { cosineSimilarity, generateEmbedding } from './embeddingService.js';

const CHROMA_DIR = path.resolve(process.cwd(), 'data', 'chroma');
const VECTORS_FILE = path.join(CHROMA_DIR, 'vectors.json');

if (!fs.existsSync(CHROMA_DIR)) {
  fs.mkdirSync(CHROMA_DIR, { recursive: true });
}

let vectorCache = null;

function loadVectors() {
  if (vectorCache) return vectorCache;
  if (fs.existsSync(VECTORS_FILE)) {
    try {
      const data = JSON.parse(fs.readFileSync(VECTORS_FILE, 'utf-8'));
      vectorCache = Array.isArray(data) ? data : [];
    } catch (e) {
      console.error('[VectorService] Failed to read vectors file:', e);
      vectorCache = [];
    }
  } else {
    vectorCache = [];
  }
  return vectorCache;
}

function saveVectors() {
  if (!vectorCache) return;
  fs.writeFileSync(VECTORS_FILE, JSON.stringify(vectorCache, null, 2), 'utf-8');
}

/**
 * Add a batch of chunk vectors to persistent storage
 */
export async function addChunks(chunksWithEmbeddings) {
  const store = loadVectors();
  for (const item of chunksWithEmbeddings) {
    // Remove if already exists
    const existingIdx = store.findIndex((v) => v.chunk_id === item.chunk_id);
    if (existingIdx >= 0) {
      store[existingIdx] = item;
    } else {
      store.push(item);
    }
  }
  saveVectors();
  return chunksWithEmbeddings.length;
}

/**
 * Search semantically using query vector
 */
export async function searchVectors(queryText, topK = 5, documentId = null) {
  const store = loadVectors();
  if (store.length === 0) return [];

  const queryEmbedding = await generateEmbedding(queryText);

  // Score each chunk
  let candidates = store;
  if (documentId) {
    candidates = store.filter((c) => c.document_id === documentId);
  }

  const scored = candidates.map((item) => {
    const similarity = cosineSimilarity(queryEmbedding, item.embedding);
    return {
      chunk_id: item.chunk_id,
      document_id: item.document_id,
      document_name: item.document_name,
      page_number: item.page_number,
      chunk_index: item.chunk_index,
      text: item.text,
      similarity_score: Number(similarity.toFixed(4)),
    };
  });

  // Sort by similarity descending
  scored.sort((a, b) => b.similarity_score - a.similarity_score);
  return scored.slice(0, topK);
}

/**
 * Delete all vectors associated with a document
 */
export function deleteDocumentVectors(documentId) {
  const store = loadVectors();
  vectorCache = store.filter((v) => v.document_id !== documentId);
  saveVectors();
  return true;
}

/**
 * Total vector count
 */
export function getVectorCount() {
  const store = loadVectors();
  return store.length;
}

/**
 * Clear all vectors
 */
export function clearAllVectors() {
  vectorCache = [];
  saveVectors();
}
