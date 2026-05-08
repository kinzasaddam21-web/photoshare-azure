const config = require('../config');

const adapter = config.db.mode === 'cosmos' ? require('./cosmos') : require('./sqlite');

async function init() {
  // SQLite init is sync; Cosmos is async — handle both
  const result = adapter.init();
  if (result && typeof result.then === 'function') await result;
}

// Wrap sync sqlite calls into promises so route handlers are uniform
function wrap(fn) {
  return async (...args) => fn(...args);
}

module.exports = {
  init,
  createUser: wrap(adapter.createUser),
  findUserByUsername: wrap(adapter.findUserByUsername),
  findUserById: wrap(adapter.findUserById),
  createImage: wrap(adapter.createImage),
  listImages: wrap(adapter.listImages),
  getImageById: wrap(adapter.getImageById),
  deleteImage: wrap(adapter.deleteImage),
  updateImageTags: wrap(adapter.updateImageTags),
};
