const config = require('../config');

/**
 * Calls Azure AI Vision (Image Analysis 4.0) to extract tags from an image buffer.
 * Returns array of tag strings. Returns [] if disabled or on failure.
 */
async function analyzeImage(imageBuffer) {
  if (!config.aiVision.enabled) return [];

  try {
    // Use Image Analysis 4.0 REST endpoint with native fetch
    const url = `${config.aiVision.endpoint.replace(/\/$/, '')}/computervision/imageanalysis:analyze?api-version=2024-02-01&features=tags,caption&language=en`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': config.aiVision.key,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer,
    });

    if (!response.ok) {
      const text = await response.text();
      console.warn('[ai-vision] error:', response.status, text);
      return [];
    }

    const data = await response.json();
    const tags = (data.tagsResult?.values || [])
      .filter(t => t.confidence >= 0.7)
      .map(t => t.name)
      .slice(0, 10);

    console.log(`[ai-vision] extracted ${tags.length} tags`);
    return tags;
  } catch (err) {
    console.warn('[ai-vision] failed:', err.message);
    return [];
  }
}

module.exports = { analyzeImage };
