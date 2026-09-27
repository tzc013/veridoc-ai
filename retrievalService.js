import { searchVectors } from './vectorService.js';

export const RELEVANCE_THRESHOLD = 0.25;

/**
 * Retrieves top-k relevant chunks with relevance scoring and threshold filtering.
 */
export async function retrieveRelevantChunks({ query, topK = 5, documentId = null }) {
  const rawResults = await searchVectors(query, topK * 2, documentId);

  // Filter with relevance threshold
  const filtered = rawResults.filter((r) => r.similarity_score >= RELEVANCE_THRESHOLD);

  // Deduplicate and return topK
  const seen = new Set();
  const deduped = [];
  for (const item of (filtered.length > 0 ? filtered : rawResults)) {
    if (!seen.has(item.chunk_id)) {
      seen.add(item.chunk_id);
      deduped.push(item);
      if (deduped.length >= topK) break;
    }
  }

  return {
    results: deduped,
    isSufficientlyRelevant: deduped.length > 0 && deduped[0].similarity_score >= RELEVANCE_THRESHOLD,
    maxScore: deduped.length > 0 ? deduped[0].similarity_score : 0,
  };
}
