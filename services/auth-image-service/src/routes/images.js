const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const storage = require('../services/storage');
const { analyzeImage } = require('../services/aiVision');
const { popularTags } = require('../services/similarity');
const { authenticate, requireRole } = require('../middleware/auth');
const { trackEvent } = require('../services/telemetry');

const router = express.Router();

// In-memory upload — we forward buffer to storage adapter
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    if (!/^image\/(jpeg|png|gif|webp)$/.test(file.mimetype)) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  },
});

// List all images (public)
router.get('/', async (req, res) => {
  const images = await db.listImages({ limit: 100 });
  res.json({ images });
});

// Popular tags across all photos (public) — drives the smart-tag chip suggestions
router.get('/tags/popular', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);
  const all = await db.listImages({ limit: 500 });
  res.json({ tags: popularTags(all, limit) });
});

// Get one image (public)
router.get('/:id', async (req, res) => {
  const image = await db.getImageById(req.params.id);
  if (!image) return res.status(404).json({ error: 'not found' });
  res.json({ image });
});

// Upload (admin only)
router.post(
  '/',
  authenticate,
  requireRole('admin'),
  upload.single('file'),
  async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'file required' });

    const { title, caption, location, people_present } = req.body;
    if (!title) return res.status(400).json({ error: 'title required' });

    try {
      const ext = path.extname(req.file.originalname) || '.jpg';
      const fileName = `${uuidv4()}${ext}`;
      const blobUrl = await storage.uploadBuffer({
        buffer: req.file.buffer,
        fileName,
        mimeType: req.file.mimetype,
      });

      let peopleArr = [];
      if (people_present) {
        peopleArr = Array.isArray(people_present)
          ? people_present
          : people_present.split(',').map(s => s.trim()).filter(Boolean);
      }

      const image = {
        id: uuidv4(),
        creator_id: req.user.id,
        title,
        caption: caption || '',
        location: location || '',
        people_present: peopleArr,
        tags: [],
        blob_url: blobUrl,
        thumbnail_url: '',
        upload_timestamp: new Date().toISOString(),
      };

      await db.createImage(image);

      // Fire-and-forget AI Vision tagging (don't block response)
      analyzeImage(req.file.buffer)
        .then(tags => {
          if (tags.length > 0) {
            db.updateImageTags(image.id, tags).catch(err =>
              console.warn('[images] tag update failed:', err.message)
            );
            trackEvent('AIVisionTagged', { imageId: image.id, tagCount: tags.length });
          }
        })
        .catch(err => console.warn('[ai-vision] async failed:', err.message));

      trackEvent('ImageUploaded', { imageId: image.id, creator: req.user.username });
      res.status(201).json({ image });
    } catch (err) {
      console.error('[images] upload error:', err);
      res.status(500).json({ error: 'upload failed' });
    }
  }
);

// Delete (admin only)
router.delete('/:id', authenticate, requireRole('admin'), async (req, res) => {
  const image = await db.getImageById(req.params.id);
  if (!image) return res.status(404).json({ error: 'not found' });
  await storage.deleteByUrl(image.blob_url);
  await db.deleteImage(req.params.id);
  trackEvent('ImageDeleted', { imageId: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
