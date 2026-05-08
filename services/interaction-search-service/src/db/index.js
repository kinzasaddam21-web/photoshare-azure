const config = require('../config');
const adapter = config.db.mode === 'cosmos' ? require('./cosmos') : require('./sqlite');

async function init() {
  const result = adapter.init();
  if (result && typeof result.then === 'function') await result;
}

function wrap(fn) {
  return async (...args) => fn(...args);
}

module.exports = {
  init,
  addComment: wrap(adapter.addComment),
  listComments: wrap(adapter.listComments),
  upsertRating: wrap(adapter.upsertRating),
  getRatingSummary: wrap(adapter.getRatingSummary),
  getUserRating: wrap(adapter.getUserRating),
  searchLocal: wrap(adapter.searchLocal),
  upsertImageForSearch: wrap(adapter.upsertImageForSearch),
};
