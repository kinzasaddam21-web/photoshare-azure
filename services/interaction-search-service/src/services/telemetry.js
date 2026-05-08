const config = require('../config');

let client = null;

if (config.appInsights.enabled) {
  try {
    const appInsights = require('applicationinsights');
    appInsights
      .setup(config.appInsights.connectionString)
      .setAutoDependencyCorrelation(true)
      .setAutoCollectRequests(true)
      .setAutoCollectPerformance(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectDependencies(true)
      .setUseDiskRetryCaching(true)
      .start();
    client = appInsights.defaultClient;
    client.context.tags[client.context.keys.cloudRole] = 'interaction-search-service';
    console.log('[telemetry] Application Insights enabled');
  } catch (err) {
    console.warn('[telemetry] Failed to start App Insights:', err.message);
  }
} else {
  console.log('[telemetry] Application Insights disabled');
}

function trackEvent(name, properties) {
  if (client) client.trackEvent({ name, properties });
}

function trackException(err, properties) {
  if (client) client.trackException({ exception: err, properties });
}

module.exports = { trackEvent, trackException };
