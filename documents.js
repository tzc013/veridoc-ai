import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  processDocument,
  getAllDocuments,
  getDocumentById,
  deleteDocument,
  reprocessDocument,
} from '../services/documentService.js';
import { getDb, queryOne } from '../db/database.js';

const router = express.Router();

const UPLOADS_DIR = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${path.basename(file.originalname, ext)}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.txt'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error("This file type isn't supported. Upload a PDF, DOCX or TXT file."));
    }
  },
});

// POST /api/documents/upload
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const doc = await processDocument({
      filePath: req.file.path,
      originalFilename: req.file.originalname,
      fileType: req.file.mimetype || path.extname(req.file.originalname),
      fileSize: req.file.size,
    });

    res.status(201).json({ success: true, document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to process document' });
  }
});

// GET /api/documents
router.get('/', async (req, res) => {
  try {
    const docs = await getAllDocuments();
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id
router.get('/:id', async (req, res) => {
  try {
    const doc = await getDocumentById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/documents/:id
router.delete('/:id', async (req, res) => {
  try {
    const success = await deleteDocument(req.params.id);
    if (!success) return res.status(404).json({ error: 'Document not found' });
    res.json({ success: true, message: 'Document and vectors deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/documents/:id/reprocess
router.post('/:id/reprocess', async (req, res) => {
  try {
    const updated = await reprocessDocument(req.params.id);
    res.json({ success: true, document: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/documents/:id/status
router.get('/:id/status', async (req, res) => {
  try {
    const db = await getDb();
    const doc = queryOne(db, `SELECT id, status, page_count, chunk_count, error_message, updated_at FROM documents WHERE id = ?`, [req.params.id]);
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
