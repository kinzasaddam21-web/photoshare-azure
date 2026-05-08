const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { trackEvent } = require('../services/telemetry');

const router = express.Router();

// GET /comments?image_id=...
router.get('/', async (req, res) => {
  const { image_id } = req.query;
  if (!image_id) return res.status(400).json({ error: 'image_id required' });
  const comments = await db.listComments(image_id);
  res.json({ comments });
});

// POST /comments  { image_id, text }
router.post('/', authenticate, async (req, res) => {
  const { image_id, text } = req.body || {};
  if (!image_id || !text) {
    return res.status(400).json({ error: 'image_id and text required' });
  }
  if (text.length > 1000) {
    return res.status(400).json({ error: 'text too long (max 1000 chars)' });
  }
  const comment = await db.addComment({
    image_id,
    user_id: req.user.id,
    username: req.user.username,
    text,
  });
  trackEvent('CommentAdded', { image_id, user: req.user.username });
  res.status(201).json({ comment });
});

module.exports = router;
