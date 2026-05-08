const express = require('express');
const db = require('../db');
const aiSearch = require('../services/aiSearch');
const config = require('../config');
const { trackEvent } = require('../services/telemetry');

const router = express.Router();

// GET /search?q=...&location=...&tag=...
router.get('/', async (req, res) => {
  const { q, location, tag } = req.query;
  const limit = Math.min(parseInt(req.query.limit, 10) || 50, 100);

  let results = null;
  let source = 'local';

  // Try Azure AI Search first if enabled
  if (config.search.enabled) {
    try {
      results = await aiSearch.search({ q, location, tag, limit });
      source = 'azure-ai-search';
    } catch (err) {
      console.warn('[search] AI Search failed, falling back:', err.message);
    }
  }

  // Fallback to local DB search
  if (!results) {
    if (config.db.mode === 'sqlite') {
      // sqlite mode needs the local mirror to be populated
      results = await db.searchLocal({ q, location, tag, limit });
      // If empty and no q/location/tag provided, hydrate from auth-image-service
      if (results.length === 0 && !q && !location && !tag) {
        await hydrateFromAuthImageService();
        results = await db.searchLocal({ q, location, tag, limit });
      } else if (results.length === 0) {
        // Hydrate then retry — handles fresh DB
        await hydrateFromAuthImageService();
        results = await db.searchLocal({ q, location, tag, limit });
      }
    } else {
      // cosmos mode — query directly
      results = await db.searchLocal({ q, location, tag, limit });
    }
  }

  trackEvent('SearchPerformed', { q: q || '', location: location || '', tag: tag || '', source, count: results.length });
  res.json({ results, source, count: results.length });
});

// Hydrate local search mirror by pulling from auth-image-service.
// Called lazily; only relevant in sqlite mode.
let lastHydrate = 0;
async function hydrateFromAuthImageService() {
  const now = Date.now();
  if (now - lastHydrate < 5000) return; // cache 5s to avoid storms
  lastHydrate = now;
  try {
    const resp = await fetch(`${config.authImageServiceUrl}/images`);
    if (!resp.ok) return;
    const { images } = await resp.json();
    for (const img of images || []) {
      await db.upsertImageForSearch(img);
    }
    console.log(`[search] hydrated ${images.length} images for local search`);
  } catch (err) {
    console.warn('[search] hydrate failed:', err.message);
  }
}

module.exports = router;
