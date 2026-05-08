require('./services/telemetry');

const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');
const aiSearch = require('./services/aiSearch');

const commentsRoutes = require('./routes/comments');
const ratingsRoutes = require('./routes/ratings');
const searchRoutes = require('./routes/search');

async function main() {
  await db.init();
  await aiSearch.init();

  const app = express();
  app.use(
    cors({
      origin: config.cors.origin === '*' ? true : config.cors.origin.split(','),
      credentials: true,
    })
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (req, res) =>
    res.json({ status: 'ok', service: 'interaction-search-service' })
  );
  app.get('/', (req, res) =>
    res.json({
      service: 'interaction-search-service',
      version: '1.0.0',
      endpoints: ['/health', '/comments', '/ratings', '/search'],
    })
  );

  app.use('/comments', commentsRoutes);
  app.use('/ratings', ratingsRoutes);
  app.use('/search', searchRoutes);

  app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(500).json({ error: err.message || 'internal error' });
  });

  app.listen(config.port, '0.0.0.0', () => {
    console.log(`[interaction-search-service] listening on :${config.port}`);
    console.log(`  db: ${config.db.mode}, search: ${config.search.enabled ? 'azure-ai-search' : 'local'}`);
    console.log(`  App Insights: ${config.appInsights.enabled ? 'enabled' : 'disabled'}`);
  });
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
