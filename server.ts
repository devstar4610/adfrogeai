/**
 * AdForge AI - Full-Stack Application Server
 * Mounts Express API endpoints and integrates Vite middleware in development.
 */
import express from 'express';
import path from 'path';
import { config } from './server/config';
import { apiRouter } from './server/routes/api';

async function startServer() {
  const app = express();

  // Body parser with generous limits for media payloads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ extended: true, limit: '100mb' }));

  // API Routes
  app.use('/api', apiRouter);

  if (process.env.NODE_ENV !== 'production') {
    // In development, mount Vite SPA middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve the compiled bundle
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[AdForge AI] Creative production studio server listening on port ${config.port}`);
  });
}

startServer().catch((err) => {
  console.error('[AdForge AI] Fatal startup error:', err);
  process.exit(1);
});
