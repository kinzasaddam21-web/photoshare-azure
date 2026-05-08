const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { authenticate } = require('../middleware/auth');
const { trackEvent } = require('../services/telemetry');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }

  const existing = await db.findUserByUsername(username);
  if (existing) return res.status(409).json({ error: 'username already taken' });

  const passwordHash = bcrypt.hashSync(password, 10);
  const user = await db.createUser({
    username,
    passwordHash,
    role: 'user',
  });
  trackEvent('UserRegistered', { username: user.username, role: user.role });
  res.status(201).json({ id: user.id, username: user.username, role: user.role });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: 'username and password required' });
  }
  const user = await db.findUserByUsername(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
  trackEvent('UserLoggedIn', { username: user.username });
  res.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
});

router.get('/verify', authenticate, async (req, res) => {
  const fresh = await db.findUserById(req.user.id);
  if (!fresh) return res.status(404).json({ error: 'User not found' });
  res.json({ user: fresh });
});

module.exports = router;
