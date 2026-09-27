import express from 'express';
import { getDb, queryOne } from '../db/database.js';
import { getVectorCount } from '../services/vectorService.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const db = await getDb();
    const docCount = queryOne(db, 'SELECT COUNT(*) as c FROM documents')?.c || 0;
    const vectorCount = getVectorCount();

    res.json({
      status: 'healthy',
      product: 'VERIDOC AI',
      timestamp: new Date().toISOString(),
      platform: 'Node.js + SQLite + Chroma Vector Storage + Gemini Grounded RAG',
      geminiKeyConfigured: !!process.env.GEMINI_API_KEY,
      storage: {
        documents: docCount,
        vectors: vectorCount,
      },
    });
  } catch (err) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

export default router;
