import express from 'express';
import crypto from 'crypto';
import { getDb, queryAll, queryOne, runQuery } from '../db/database.js';
import { askRAG } from '../services/ragService.js';

const router = express.Router();

// POST /api/chat/sessions
router.post('/sessions', async (req, res) => {
  try {
    const db = await getDb();
    const sessionId = 'ses_' + crypto.randomUUID().slice(0, 8);
    const title = req.body.title || 'New Inquiry';
    const now = new Date().toISOString();

    runQuery(
      db,
      `INSERT INTO chat_sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)`,
      [sessionId, title, now, now]
    );

    res.status(201).json({ id: sessionId, title, created_at: now, updated_at: now });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions
router.get('/sessions', async (req, res) => {
  try {
    const db = await getDb();
    const sessions = queryAll(
      db,
      `SELECT s.*, 
        (SELECT COUNT(*) FROM messages m WHERE m.session_id = s.id) as message_count,
        (SELECT content FROM messages m WHERE m.session_id = s.id ORDER BY created_at DESC LIMIT 1) as last_message
       FROM chat_sessions s
       ORDER BY s.updated_at DESC`
    );
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/chat/sessions/:id
router.get('/sessions/:id', async (req, res) => {
  try {
    const db = await getDb();
    const session = queryOne(db, `SELECT * FROM chat_sessions WHERE id = ?`, [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Chat session not found' });

    const messages = queryAll(
      db,
      `SELECT * FROM messages WHERE session_id = ? ORDER BY created_at ASC`,
      [req.params.id]
    );

    // Fetch sources for assistant messages
    for (const msg of messages) {
      if (msg.role === 'assistant') {
        const sources = queryAll(
          db,
          `SELECT * FROM message_sources WHERE message_id = ? ORDER BY similarity_score DESC`,
          [msg.id]
        );
        msg.sources = sources;
      }
    }

    res.json({
      ...session,
      messages,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/chat/sessions/:id
router.delete('/sessions/:id', async (req, res) => {
  try {
    const db = await getDb();
    const session = queryOne(db, `SELECT * FROM chat_sessions WHERE id = ?`, [req.params.id]);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    // Cascade delete messages and sources
    const messages = queryAll(db, `SELECT id FROM messages WHERE session_id = ?`, [req.params.id]);
    for (const m of messages) {
      runQuery(db, `DELETE FROM message_sources WHERE message_id = ?`, [m.id]);
    }
    runQuery(db, `DELETE FROM messages WHERE session_id = ?`, [req.params.id]);
    runQuery(db, `DELETE FROM chat_sessions WHERE id = ?`, [req.params.id]);

    res.json({ success: true, message: 'Chat session deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/chat/sessions/:id/messages
router.post('/sessions/:id/messages', async (req, res) => {
  try {
    const { question, top_k = 5, document_id = null } = req.body;
    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const startTime = Date.now();
    const result = await askRAG({
      sessionId: req.params.id,
      question: question.trim(),
      topK: top_k,
      documentId: document_id,
    });
    const latencyMs = Date.now() - startTime;

    res.json({
      ...result,
      latencyMs,
    });
  } catch (err) {
    console.error('[ChatRoute] Error asking RAG:', err);
    res.status(500).json({ error: err.message || 'Error generating grounded answer' });
  }
});

export default router;
