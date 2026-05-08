const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

let db;

function init() {
  const dir = path.dirname(config.db.sqlitePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  db = new Database(config.db.sqlitePath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      image_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ratings (
      id TEXT PRIMARY KEY,
      image_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      value INTEGER NOT NULL CHECK(value BETWEEN 1 AND 5),
      timestamp TEXT NOT NULL,
      UNIQUE(image_id, user_id)
    );

    CREATE INDEX IF NOT EXISTS idx_comments_image ON comments(image_id);
    CREATE INDEX IF NOT EXISTS idx_ratings_image ON ratings(image_id);

    -- Local mirror of images for searching when AI Search isn't available
    CREATE TABLE IF NOT EXISTS images_search (
      id TEXT PRIMARY KEY,
      title TEXT,
      caption TEXT,
      location TEXT,
      people_present TEXT,
      tags TEXT,
      blob_url TEXT,
      creator_id TEXT,
      upload_timestamp TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_images_search_title ON images_search(title);
    CREATE INDEX IF NOT EXISTS idx_images_search_location ON images_search(location);
  `);

  console.log('[db] SQLite initialized at', config.db.sqlitePath);
}

// ---------- COMMENTS ----------
function addComment({ image_id, user_id, username, text }) {
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  db.prepare(
    'INSERT INTO comments (id, image_id, user_id, username, text, timestamp) VALUES (?, ?, ?, ?, ?, ?)'
  ).run(id, image_id, user_id, username, text, timestamp);
  return { id, image_id, user_id, username, text, timestamp };
}

function listComments(image_id) {
  return db
    .prepare('SELECT * FROM comments WHERE image_id = ? ORDER BY timestamp ASC')
    .all(image_id);
}

// ---------- RATINGS ----------
function upsertRating({ image_id, user_id, value }) {
  const timestamp = new Date().toISOString();
  const existing = db
    .prepare('SELECT id FROM ratings WHERE image_id = ? AND user_id = ?')
    .get(image_id, user_id);

  if (existing) {
    db.prepare(
      'UPDATE ratings SET value = ?, timestamp = ? WHERE id = ?'
    ).run(value, timestamp, existing.id);
    return { id: existing.id, image_id, user_id, value, timestamp };
  }
  const id = uuidv4();
  db.prepare(
    'INSERT INTO ratings (id, image_id, user_id, value, timestamp) VALUES (?, ?, ?, ?, ?)'
  ).run(id, image_id, user_id, value, timestamp);
  return { id, image_id, user_id, value, timestamp };
}

function getRatingSummary(image_id) {
  const row = db
    .prepare(
      'SELECT COUNT(*) as count, AVG(value) as avg FROM ratings WHERE image_id = ?'
    )
    .get(image_id);
  return {
    count: row.count || 0,
    average: row.avg ? Math.round(row.avg * 10) / 10 : 0,
  };
}

function getUserRating(image_id, user_id) {
  const row = db
    .prepare('SELECT value FROM ratings WHERE image_id = ? AND user_id = ?')
    .get(image_id, user_id);
  return row ? row.value : null;
}

// ---------- SEARCH MIRROR ----------
function upsertImageForSearch(img) {
  db.prepare(
    `INSERT OR REPLACE INTO images_search
     (id, title, caption, location, people_present, tags, blob_url, creator_id, upload_timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    img.id,
    img.title || '',
    img.caption || '',
    img.location || '',
    Array.isArray(img.people_present) ? img.people_present.join(',') : (img.people_present || ''),
    Array.isArray(img.tags) ? img.tags.join(',') : (img.tags || ''),
    img.blob_url || '',
    img.creator_id || '',
    img.upload_timestamp || ''
  );
}

function searchLocal({ q, location, tag, limit = 50 }) {
  const conditions = [];
  const params = [];
  if (q) {
    conditions.push('(title LIKE ? OR caption LIKE ? OR people_present LIKE ? OR tags LIKE ?)');
    const term = `%${q}%`;
    params.push(term, term, term, term);
  }
  if (location) {
    conditions.push('location LIKE ?');
    params.push(`%${location}%`);
  }
  if (tag) {
    conditions.push('tags LIKE ?');
    params.push(`%${tag}%`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT * FROM images_search ${where} ORDER BY upload_timestamp DESC LIMIT ?`;
  params.push(limit);

  const rows = db.prepare(sql).all(...params);
  return rows.map(r => ({
    ...r,
    people_present: r.people_present ? r.people_present.split(',').filter(Boolean) : [],
    tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
  }));
}

module.exports = {
  init,
  addComment,
  listComments,
  upsertRating,
  getRatingSummary,
  getUserRating,
  upsertImageForSearch,
  searchLocal,
};
