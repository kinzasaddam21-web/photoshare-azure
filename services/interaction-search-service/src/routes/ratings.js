const express = require('express');
const db = require('../db');
const { authenticate, authenticateOptional } = require('../middleware/auth');
const { trackEvent } = require('../services/telemetry');

const router = express.Router();

// GET /ratings?image_id=...  → returns { average, count, my_rating }
router.get('/', authenticateOptional, async (req, res) => {
  const { image_id } = req.query;
  if (!image_id) return res.status(400).json({ error: 'image_id required' });
  const summary = await db.getRatingSummary(image_id);
  let myRating = null;
  if (req.user) {
    myRating = await db.getUserRating(image_id, req.user.id);
  }
  res.json({ ...summary, my_rating: myRating });
});

// POST /ratings  { image_id, value }
router.post('/', authenticate, async (req, res) => {
  const { image_id, value } = req.body || {};
  const v = parseInt(value, 10);
  if (!image_id || !v || v < 1 || v > 5) {
    return res.status(400).json({ error: 'image_id and value (1-5) required' });
  }
  const rating = await db.upsertRating({
    image_id,
    user_id: req.user.id,
    value: v,
  });
  trackEvent('RatingSubmitted', { image_id, value: v, user: req.user.username });
  res.status(201).json({ rating });
});

module.exports = router;
