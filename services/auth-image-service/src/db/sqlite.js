const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

let db;

function init() {
  const dir = path.dirname(config.db.sqlitePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const Database = require('better-sqlite3');
   db = new Database(config.db.sqlitePath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'user')),
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS images (
      id TEXT PRIMARY KEY,
      creator_id TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT,
      location TEXT,
      people_present TEXT,
      tags TEXT,
      blob_url TEXT NOT NULL,
      thumbnail_url TEXT,
      upload_timestamp TEXT NOT NULL,
      FOREIGN KEY (creator_id) REFERENCES users(id)
    );

    CREATE INDEX IF NOT EXISTS idx_images_creator ON images(creator_id);
    CREATE INDEX IF NOT EXISTS idx_images_timestamp ON images(upload_timestamp DESC);
  `);

  seedDefaults();
  console.log('[db] SQLite initialized at', config.db.sqlitePath);
}

function seedDefaults() {
  const count = db.prepare('SELECT COUNT(*) as c FROM users').get().c;
  if (count > 0) return;

  const insert = db.prepare(
    'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
  );
  const now = new Date().toISOString();
  insert.run(uuidv4(), 'admin', bcrypt.hashSync('admin123', 10), 'admin', now);
  insert.run(uuidv4(), 'user1', bcrypt.hashSync('user123', 10), 'user', now);
  console.log('[db] Seeded default users: admin/admin123, user1/user123');
}

// ---------- USER OPERATIONS ----------
function createUser({ username, passwordHash, role }) {
  const id = uuidv4();
  const createdAt = new Date().toISOString();
  db.prepare(
    'INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(id, username, passwordHash, role, createdAt);
  return { id, username, role, created_at: createdAt };
}

function findUserByUsername(username) {
  return db.prepare('SELECT * FROM users WHERE username = ?').get(username);
}

function findUserById(id) {
  return db.prepare('SELECT id, username, role, created_at FROM users WHERE id = ?').get(id);
}

// ---------- IMAGE OPERATIONS ----------
function createImage(image) {
  db.prepare(
    `INSERT INTO images
     (id, creator_id, title, caption, location, people_present, tags, blob_url, thumbnail_url, upload_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    image.id,
    image.creator_id,
    image.title,
    image.caption || '',
    image.location || '',
    JSON.stringify(image.people_present || []),
    JSON.stringify(image.tags || []),
    image.blob_url,
    image.thumbnail_url || '',
    image.upload_timestamp
  );
  return image;
}

function listImages({ limit = 50, offset = 0 } = {}) {
  const rows = db
    .prepare('SELECT * FROM images ORDER BY upload_timestamp DESC LIMIT ? OFFSET ?')
    .all(limit, offset);
  return rows.map(rowToImage);
}

function getImageById(id) {
  const row = db.prepare('SELECT * FROM images WHERE id = ?').get(id);
  return row ? rowToImage(row) : null;
}

function deleteImage(id) {
  return db.prepare('DELETE FROM images WHERE id = ?').run(id).changes > 0;
}

function updateImageTags(id, tags) {
  db.prepare('UPDATE images SET tags = ? WHERE id = ?').run(JSON.stringify(tags), id);
}

function rowToImage(row) {
  return {
    ...row,
    people_present: safeJsonParse(row.people_present, []),
    tags: safeJsonParse(row.tags, []),
  };
}

function safeJsonParse(s, fallback) {
  try {
    return JSON.parse(s);
  } catch {
    return fallback;
  }
}

module.exports = {
  init,
  createUser,
  findUserByUsername,
  findUserById,
  createImage,
  listImages,
  getImageById,
  deleteImage,
  updateImageTags,
};
