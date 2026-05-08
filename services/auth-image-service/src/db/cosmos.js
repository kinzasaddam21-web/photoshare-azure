const { CosmosClient } = require('@azure/cosmos');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');

let client, database, usersContainer, imagesContainer;

async function init() {
  client = new CosmosClient({
    endpoint: config.db.cosmos.endpoint,
    key: config.db.cosmos.key,
  });

  const dbResp = await client.databases.createIfNotExists({ id: config.db.cosmos.database });
  database = dbResp.database;

  const usersResp = await database.containers.createIfNotExists({
    id: config.db.cosmos.containerUsers,
    partitionKey: { paths: ['/id'] },
  });
  usersContainer = usersResp.container;

  const imagesResp = await database.containers.createIfNotExists({
    id: config.db.cosmos.containerImages,
    partitionKey: { paths: ['/creator_id'] },
  });
  imagesContainer = imagesResp.container;

  await seedDefaults();
  console.log('[db] Cosmos DB initialized');
}

async function seedDefaults() {
  const { resources } = await usersContainer.items
    .query('SELECT VALUE COUNT(1) FROM c')
    .fetchAll();
  if (resources[0] > 0) return;

  const now = new Date().toISOString();
  await usersContainer.items.create({
    id: uuidv4(),
    username: 'admin',
    password_hash: bcrypt.hashSync('admin123', 10),
    role: 'admin',
    created_at: now,
  });
  await usersContainer.items.create({
    id: uuidv4(),
    username: 'user1',
    password_hash: bcrypt.hashSync('user123', 10),
    role: 'user',
    created_at: now,
  });
  console.log('[db] Seeded default users');
}

async function createUser({ username, passwordHash, role }) {
  const user = {
    id: uuidv4(),
    username,
    password_hash: passwordHash,
    role,
    created_at: new Date().toISOString(),
  };
  await usersContainer.items.create(user);
  return user;
}

async function findUserByUsername(username) {
  const { resources } = await usersContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.username = @username',
      parameters: [{ name: '@username', value: username }],
    })
    .fetchAll();
  return resources[0] || null;
}

async function findUserById(id) {
  try {
    const { resource } = await usersContainer.item(id, id).read();
    if (!resource) return null;
    const { password_hash, ...safe } = resource;
    return safe;
  } catch (err) {
    if (err.code === 404) return null;
    throw err;
  }
}

async function createImage(image) {
  await imagesContainer.items.create(image);
  return image;
}

async function listImages({ limit = 50 } = {}) {
  const { resources } = await imagesContainer.items
    .query(`SELECT TOP ${limit} * FROM c ORDER BY c.upload_timestamp DESC`)
    .fetchAll();
  return resources;
}

async function getImageById(id) {
  const { resources } = await imagesContainer.items
    .query({
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [{ name: '@id', value: id }],
    })
    .fetchAll();
  return resources[0] || null;
}

async function deleteImage(id) {
  const image = await getImageById(id);
  if (!image) return false;
  await imagesContainer.item(id, image.creator_id).delete();
  return true;
}

async function updateImageTags(id, tags) {
  const image = await getImageById(id);
  if (!image) return;
  image.tags = tags;
  await imagesContainer.item(id, image.creator_id).replace(image);
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
