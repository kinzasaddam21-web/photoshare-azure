const { CosmosClient } = require('@azure/cosmos');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

let client, database, commentsContainer, ratingsContainer, imagesContainer;

async function init() {
  client = new CosmosClient({
    endpoint: config.db.cosmos.endpoint,
    key: config.db.cosmos.key,
  });

  const dbResp = await client.databases.createIfNotExists({ id: config.db.cosmos.database });
  database = dbResp.database;

  const cResp = await database.containers.createIfNotExists({
    id: config.db.cosmos.containerComments,
    partitionKey: { paths: ['/image_id'] },
  });
  commentsContainer = cResp.container;

  const rResp = await database.containers.createIfNotExists({
    id: config.db.cosmos.containerRatings,
    partitionKey: { paths: ['/image_id'] },
  });
  ratingsContainer = rResp.container;

  // Image container is shared with auth-image-service; we only read from it
  const iResp = await database.containers.createIfNotExists({
    id: config.db.cosmos.containerImages,
    partitionKey: { paths: ['/creator_id'] },
  });
  imagesContainer = iResp.container;

  console.log('[db] Cosmos DB initialized');
}

// ---------- COMMENTS ----------
async function addComment({ image_id, user_id, username, text }) {
  const comment = {
    id: uuidv4(),
    image_id,
    user_id,
    username,
    text,
    timestamp: new Date().toISOString(),
  };
  await commentsContainer.items.create(comment);
  return comment;
}

async function listComments(image_id) {
  const { resources } = await commentsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.image_id = @id ORDER BY c.timestamp ASC',
      parameters: [{ name: '@id', value: image_id }],
    })
    .fetchAll();
  return resources;
}

// ---------- RATINGS ----------
async function upsertRating({ image_id, user_id, value }) {
  const { resources } = await ratingsContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.image_id = @img AND c.user_id = @uid',
      parameters: [
        { name: '@img', value: image_id },
        { name: '@uid', value: user_id },
      ],
    })
    .fetchAll();

  const timestamp = new Date().toISOString();
  if (resources.length > 0) {
    const existing = resources[0];
    existing.value = value;
    existing.timestamp = timestamp;
    await ratingsContainer.item(existing.id, image_id).replace(existing);
    return existing;
  }
  const rating = {
    id: uuidv4(),
    image_id,
    user_id,
    value,
    timestamp,
  };
  await ratingsContainer.items.create(rating);
  return rating;
}

async function getRatingSummary(image_id) {
  const { resources } = await ratingsContainer.items
    .query({
      query:
        'SELECT VALUE { count: COUNT(1), avg: AVG(c.value) } FROM c WHERE c.image_id = @id',
      parameters: [{ name: '@id', value: image_id }],
    })
    .fetchAll();
  const r = resources[0] || { count: 0, avg: 0 };
  return {
    count: r.count || 0,
    average: r.avg ? Math.round(r.avg * 10) / 10 : 0,
  };
}

async function getUserRating(image_id, user_id) {
  const { resources } = await ratingsContainer.items
    .query({
      query: 'SELECT c.value FROM c WHERE c.image_id = @img AND c.user_id = @uid',
      parameters: [
        { name: '@img', value: image_id },
        { name: '@uid', value: user_id },
      ],
    })
    .fetchAll();
  return resources[0] ? resources[0].value : null;
}

// ---------- SEARCH (Cosmos cross-partition query) ----------
async function searchLocal({ q, location, tag, limit = 50 }) {
  const conditions = [];
  const parameters = [];
  if (q) {
    conditions.push(
      '(CONTAINS(LOWER(c.title), @q) OR CONTAINS(LOWER(c.caption), @q) OR ARRAY_CONTAINS(c.tags, @q))'
    );
    parameters.push({ name: '@q', value: q.toLowerCase() });
  }
  if (location) {
    conditions.push('CONTAINS(LOWER(c.location), @loc)');
    parameters.push({ name: '@loc', value: location.toLowerCase() });
  }
  if (tag) {
    conditions.push('ARRAY_CONTAINS(c.tags, @tag)');
    parameters.push({ name: '@tag', value: tag });
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const query = `SELECT TOP ${limit} * FROM c ${where} ORDER BY c.upload_timestamp DESC`;

  const { resources } = await imagesContainer.items.query({ query, parameters }).fetchAll();
  return resources;
}

// No-op: in cosmos mode, the auth-image-service writes images directly
async function upsertImageForSearch() {
  return;
}

module.exports = {
  init,
  addComment,
  listComments,
  upsertRating,
  getRatingSummary,
  getUserRating,
  searchLocal,
  upsertImageForSearch,
};
