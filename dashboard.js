import express from 'express';
import { getDb, queryAll, queryOne } from '../db/database.js';
import { getVectorCount } from '../services/vectorService.js';

const router = express.Router();

// GET /api/dashboard/stats
router.get('/stats', async (req, res) => {
  try {
    const db = await getDb();
    
    const totalDocs = queryOne(db, `SELECT COUNT(*) as count FROM documents`)?.count || 0;
    const indexedDocs = queryOne(db, `SELECT COUNT(*) as count FROM documents WHERE status = 'INDEXED'`)?.count || 0;
    const failedDocs = queryOne(db, `SELECT COUNT(*) as count FROM documents WHERE status = 'FAILED'`)?.count || 0;
    const processingDocs = queryOne(db, `SELECT COUNT(*) as count FROM documents WHERE status = 'PROCESSING'`)?.count || 0;
    const totalChunks = queryOne(db, `SELECT COUNT(*) as count FROM chunks`)?.count || 0;
    const totalSessions = queryOne(db, `SELECT COUNT(*) as count FROM chat_sessions`)?.count || 0;
    const totalMessages = queryOne(db, `SELECT COUNT(*) as count FROM messages`)?.count || 0;
    const vectorCount = getVectorCount();

    // Aggregates for activity breakdown
    const recentDocs = queryAll(
      db,
      `SELECT id, filename, original_filename, file_type, file_size, status, page_count, chunk_count, created_at
       FROM documents ORDER BY created_at DESC LIMIT 5`
    );

    const recentQueries = queryAll(
      db,
      `SELECT m.id, m.session_id, m.content, m.created_at, s.title as session_title
       FROM messages m
       JOIN chat_sessions s ON m.session_id = s.id
       WHERE m.role = 'user'
       ORDER BY m.created_at DESC LIMIT 5`
    );

    res.json({
      totalDocuments: totalDocs,
      indexedDocuments: indexedDocs,
      failedDocuments: failedDocs,
      processingDocuments: processingDocs,
      totalChunks: totalChunks,
      totalVectors: vectorCount,
      totalSessions: totalSessions,
      totalQueries: totalMessages,
      recentDocuments: recentDocs,
      recentQueries: recentQueries,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
