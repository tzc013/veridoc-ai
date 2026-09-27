import crypto from 'crypto';

/**
 * Splits document pages into intelligent, page-aware chunks.
 * Target: ~800-1000 tokens (approximated as 3200-4000 chars or 600-800 words)
 * Overlap: ~100-150 tokens (approximated as 400-600 chars or ~80-120 words)
 */
export function chunkDocumentPages({ documentId, documentName, pages, targetTokens = 850, overlapTokens = 120 }) {
  const chunks = [];
  let globalChunkIndex = 0;

  const targetChars = Math.round(targetTokens * 4);
  const overlapChars = Math.round(overlapTokens * 4);

  for (const page of pages) {
    const pageNumber = page.pageNumber;
    const text = page.text.trim();

    if (!text) continue;

    // If page content fits within targetChars + overlap, keep as a cohesive page chunk
    if (text.length <= targetChars + 500) {
      const chunkId = `chk_${documentId}_p${pageNumber}_${globalChunkIndex}`;
      chunks.push({
        id: chunkId,
        chunk_id: chunkId,
        document_id: documentId,
        document_name: documentName,
        page_number: pageNumber,
        chunk_index: globalChunkIndex,
        text: text,
      });
      globalChunkIndex++;
      continue;
    }

    // Otherwise, split on paragraph or sentence boundaries with overlap
    const paragraphs = text.split(/\n\n+/);
    let currentChunkText = '';

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const para = paragraphs[pIdx].trim();
      if (!para) continue;

      if ((currentChunkText + '\n\n' + para).length > targetChars && currentChunkText.length > 0) {
        const chunkId = `chk_${documentId}_p${pageNumber}_${globalChunkIndex}`;
        chunks.push({
          id: chunkId,
          chunk_id: chunkId,
          document_id: documentId,
          document_name: documentName,
          page_number: pageNumber,
          chunk_index: globalChunkIndex,
          text: currentChunkText.trim(),
        });
        globalChunkIndex++;

        // Calculate overlap from end of currentChunkText
        const words = currentChunkText.split(/\s+/);
        const overlapSlice = words.slice(-Math.round(overlapTokens)).join(' ');
        currentChunkText = overlapSlice ? overlapSlice + '\n\n' + para : para;
      } else {
        currentChunkText = currentChunkText ? currentChunkText + '\n\n' + para : para;
      }
    }

    if (currentChunkText.trim()) {
      const chunkId = `chk_${documentId}_p${pageNumber}_${globalChunkIndex}`;
      chunks.push({
        id: chunkId,
        chunk_id: chunkId,
        document_id: documentId,
        document_name: documentName,
        page_number: pageNumber,
        chunk_index: globalChunkIndex,
        text: currentChunkText.trim(),
      });
      globalChunkIndex++;
    }
  }

  return chunks;
}
