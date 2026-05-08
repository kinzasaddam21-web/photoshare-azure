const { SearchClient, SearchIndexClient, AzureKeyCredential } = require('@azure/search-documents');
const config = require('../config');

let searchClient = null;
let indexClient = null;

async function init() {
  if (!config.search.enabled) {
    console.log('[ai-search] disabled — using local search fallback');
    return;
  }
  const credential = new AzureKeyCredential(config.search.azureKey);
  indexClient = new SearchIndexClient(config.search.azureEndpoint, credential);
  searchClient = new SearchClient(
    config.search.azureEndpoint,
    config.search.azureIndex,
    credential
  );

  await ensureIndex();
  console.log('[ai-search] enabled, index:', config.search.azureIndex);
}

async function ensureIndex() {
  try {
    await indexClient.getIndex(config.search.azureIndex);
  } catch (err) {
    if (err.statusCode !== 404) throw err;
    await indexClient.createIndex({
      name: config.search.azureIndex,
      fields: [
        { name: 'id', type: 'Edm.String', key: true, filterable: true },
        { name: 'title', type: 'Edm.String', searchable: true, sortable: true },
        { name: 'caption', type: 'Edm.String', searchable: true },
        { name: 'location', type: 'Edm.String', searchable: true, filterable: true, facetable: true },
        { name: 'people_present', type: 'Collection(Edm.String)', searchable: true, filterable: true },
        { name: 'tags', type: 'Collection(Edm.String)', searchable: true, filterable: true, facetable: true },
        { name: 'creator_id', type: 'Edm.String', filterable: true },
        { name: 'blob_url', type: 'Edm.String', searchable: false },
        { name: 'upload_timestamp', type: 'Edm.DateTimeOffset', sortable: true, filterable: true },
      ],
    });
    console.log('[ai-search] created index:', config.search.azureIndex);
  }
}

async function search({ q, location, tag, limit = 50 }) {
  if (!searchClient) return null;

  const filters = [];
  if (location) filters.push(`location eq '${location.replace(/'/g, "''")}'`);
  if (tag) filters.push(`tags/any(t: t eq '${tag.replace(/'/g, "''")}')`);

  const options = {
    top: limit,
    orderBy: ['upload_timestamp desc'],
    filter: filters.length ? filters.join(' and ') : undefined,
    queryType: 'simple',
    searchFields: ['title', 'caption', 'tags', 'people_present', 'location'],
  };

  const results = [];
  const searchText = q && q.length ? q : '*';
  const iter = await searchClient.search(searchText, options);
  for await (const r of iter.results) {
    results.push(r.document);
  }
  return results;
}

async function indexDocument(doc) {
  if (!searchClient) return;
  try {
    await searchClient.mergeOrUploadDocuments([doc]);
  } catch (err) {
    console.warn('[ai-search] index failed:', err.message);
  }
}

module.exports = { init, search, indexDocument };
