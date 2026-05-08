// Telemetry must be loaded first
require('./services/telemetry');

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db');
const storage = require('./services/storage');

const authRoutes = require('./routes/auth');
const imageRoutes = require('./routes/images');

async function main() {
  await db.init();
  await storage.init();

  const app = express();

  app.use(
    cors({
      origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '12mb' }));

  // Serve local uploads in dev mode
  if (config.storage.mode === 'local') {
    app.use('/uploads', express.static(config.storage.localUploadDir));
  }

  app.get('/health', (req, res) => res.json({ status: 'ok', service: 'auth-image-service' }));
  app.get('/', (req, res) =>
    res.json({
      service: 'auth-image-service',
      version: '1.0.0',
      endpoints: ['/health', '/auth/*', '/images/*'],
    })
  );

  app.use('/auth', authRoutes);
  app.use('/images', imageRoutes);

  // Global error handler
  app.use((err, req, res, next) => {
    console.error('[error]', err);
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'file too large (max 10MB)' });
    }
    res.status(500).json({ error: err.message || 'internal error' });
  });

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[auth-image-service] listening on :${config.port}`);
    console.log(`  storage: ${config.storage.mode}, db: ${config.db.mode}`);
    console.log(`  AI Vision: ${config.aiVision.enabled ? 'enabled' : 'disabled'}`);
    console.log(`  App Insights: ${config.appInsights.enabled ? 'enabled' : 'disabled'}`);
  });
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
