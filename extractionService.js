import fs from 'fs';
import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const { PDFParse } = require('pdf-parse');

/**
 * Extracts structured pages from PDF, DOCX, or TXT.
 * Returns { pages: [ { pageNumber: 1, text: '...' } ], pageCount: N, fullText: '...' }
 */
export async function extractDocumentContent(filePath, fileType) {
  const normalizedType = fileType.toLowerCase();

  if (normalizedType.includes('pdf') || filePath.endsWith('.pdf')) {
    const fileBuffer = fs.readFileSync(filePath);
    const parser = new PDFParse({ data: fileBuffer });
    await parser.load();
    const result = await parser.getText();
    
    // Result contains pages array with { text, num }
    if (result && Array.isArray(result.pages) && result.pages.length > 0) {
      const pages = result.pages.map((p, idx) => ({
        pageNumber: p.num || idx + 1,
        text: cleanExtractedText(p.text || ''),
      }));
      return {
        pages,
        pageCount: pages.length,
        fullText: pages.map((p) => p.text).join('\n\n'),
      };
    }

    // Fallback if pages not separated
    const cleaned = cleanExtractedText(result?.text || '');
    return {
      pages: [{ pageNumber: 1, text: cleaned }],
      pageCount: 1,
      fullText: cleaned,
    };
  }

  if (normalizedType.includes('docx') || normalizedType.includes('word') || filePath.endsWith('.docx')) {
    const fileBuffer = fs.readFileSync(filePath);
    const { value: rawText } = await mammoth.extractRawText({ buffer: fileBuffer });
    const cleaned = cleanExtractedText(rawText || '');
    
    // Estimate pages based on 500 words per page if docx has no page breaks
    const words = cleaned.split(/\s+/);
    const wordsPerPage = 450;
    const pages = [];
    for (let i = 0; i < words.length; i += wordsPerPage) {
      const pageWords = words.slice(i, i + wordsPerPage).join(' ');
      pages.push({
        pageNumber: Math.floor(i / wordsPerPage) + 1,
        text: pageWords,
      });
    }

    return {
      pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: cleaned }],
      pageCount: Math.max(1, pages.length),
      fullText: cleaned,
    };
  }

  // Plain text (TXT)
  const rawContent = fs.readFileSync(filePath, 'utf-8');
  const cleaned = cleanExtractedText(rawContent);
  // Break into ~3000 chars per page
  const chunkSize = 3000;
  const pages = [];
  for (let i = 0; i < cleaned.length; i += chunkSize) {
    pages.push({
      pageNumber: Math.floor(i / chunkSize) + 1,
      text: cleaned.slice(i, i + chunkSize),
    });
  }

  return {
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, text: cleaned }],
    pageCount: Math.max(1, pages.length),
    fullText: cleaned,
  };
}

/**
 * Normalizes whitespace, removes control artifacts, preserving semantic layout.
 */
export function cleanExtractedText(text) {
  if (!text) return '';
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
