import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

import healthRouter from './server/routes/health.js';
import documentsRouter from './server/routes/documents.js';
import dashboardRouter from './server/routes/dashboard.js';
import chatRouter from './server/routes/chat.js';
import seedRouter, { seedNorthstarDocuments } from './server/routes/seed.js';
import evaluationRouter from './server/routes/evaluation.js';
import { getDb } from './server/db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Basic middleware
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Initialize DB and auto-seed Northstar Estates documents if clean start
  try {
    await getDb();
    console.log('[VERIDOC AI] SQLite database initialized successfully.');
    seedNorthstarDocuments().then((seeded) => {
      if (seeded.length > 0) {
        console.log(`[VERIDOC AI] Auto-seeded ${seeded.length} Northstar Estates documents.`);
      }
    }).catch((e) => console.warn('[VERIDOC AI] Auto-seed background note:', e.message));
  } catch (err) {
    console.error('[VERIDOC AI] DB Init error:', err);
  }

  // API Routes
  app.use('/api/health', healthRouter);
  app.use('/api/documents', documentsRouter);
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/seed', seedRouter);
  app.use('/api/evaluation', evaluationRouter);

  // Serve static sample-documents for direct download/viewing
  app.use('/sample-documents', express.static(path.join(__dirname, 'sample-documents')));

  // Vite middleware for dev / static for prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[VERIDOC AI] Enterprise Server active on http://0.0.0.0:${PORT}`);
  });
}

startServer();
