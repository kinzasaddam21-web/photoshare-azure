/**
 * Aggregation helpers used by AI/discovery features.
 * Pure JS — works in local SQLite mode and Cosmos mode alike.
 */

function popularTags(images, limit = 10) {
  const counts = new Map();
  for (const img of images) {
    for (const raw of img.tags || []) {
      const tag = String(raw).toLowerCase().trim();
      if (!tag) continue;
      counts.set(tag, (counts.get(tag) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([tag, count]) => ({ tag, count }));
}

module.exports = { popularTags };
