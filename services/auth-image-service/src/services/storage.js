const fs = require('fs');
const path = require('path');
const { BlobServiceClient } = require('@azure/storage-blob');
const config = require('../config');

let blobServiceClient = null;
let containerClient = null;

async function init() {
  if (config.storage.mode === 'azure') {
    blobServiceClient = BlobServiceClient.fromConnectionString(
      config.storage.azureConnectionString
    );
    containerClient = blobServiceClient.getContainerClient(config.storage.azureContainerName);
    await containerClient.createIfNotExists({ access: 'blob' });
    console.log('[storage] Azure Blob initialized:', config.storage.azureContainerName);
  } else {
    if (!fs.existsSync(config.storage.localUploadDir)) {
      fs.mkdirSync(config.storage.localUploadDir, { recursive: true });
    }
    console.log('[storage] Local mode at', config.storage.localUploadDir);
  }
}

async function uploadBuffer({ buffer, fileName, mimeType }) {
  if (config.storage.mode === 'azure') {
    const blobClient = containerClient.getBlockBlobClient(fileName);
    await blobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: mimeType },
    });
    return blobClient.url;
  }

  const fullPath = path.join(config.storage.localUploadDir, fileName);
  fs.writeFileSync(fullPath, buffer);
  return `${config.publicBaseUrl}/uploads/${fileName}`;
}

async function deleteByUrl(url) {
  if (!url) return;
  if (config.storage.mode === 'azure') {
    try {
      const fileName = url.split('/').pop().split('?')[0];
      const blobClient = containerClient.getBlockBlobClient(fileName);
      await blobClient.deleteIfExists();
    } catch (err) {
      console.warn('[storage] delete failed:', err.message);
    }
  } else {
    try {
      const fileName = url.split('/uploads/').pop();
      const fullPath = path.join(config.storage.localUploadDir, fileName);
      if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
    } catch (err) {
      console.warn('[storage] local delete failed:', err.message);
    }
  }
}

module.exports = { init, uploadBuffer, deleteByUrl };
