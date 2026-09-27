import express from 'express';
import path from 'path';
import fs from 'fs';
import { processDocument, getAllDocuments } from '../services/documentService.js';

const router = express.Router();

export async function seedNorthstarDocuments() {
  const sampleDir = path.resolve(process.cwd(), 'sample-documents');
  if (!fs.existsSync(sampleDir)) return [];

  const existingDocs = await getAllDocuments();
  const existingNames = new Set(existingDocs.map((d) => d.original_filename));

  const sampleFiles = [
    'Company_Overview.pdf',
    'Property_Listings.pdf',
    'Services_and_Fees.pdf',
    'FAQs.pdf',
    'Policies_and_Terms.pdf',
  ];

  const results = [];
  for (const filename of sampleFiles) {
    if (existingNames.has(filename)) {
      continue;
    }

    const filePath = path.join(sampleDir, filename);
    if (!fs.existsSync(filePath)) continue;

    const stats = fs.statSync(filePath);
    try {
      const doc = await processDocument({
        filePath,
        originalFilename: filename,
        fileType: 'application/pdf',
        fileSize: stats.size,
      });
      results.push(doc);
    } catch (err) {
      console.error(`[Seed] Failed to seed ${filename}:`, err.message);
    }
  }

  return results;
}

// POST /api/seed
router.post('/', async (req, res) => {
  try {
    const seeded = await seedNorthstarDocuments();
    res.json({ success: true, count: seeded.length, documents: seeded });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
