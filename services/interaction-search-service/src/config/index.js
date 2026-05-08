require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
  },
  db: {
    mode: process.env.DB_MODE || 'sqlite',
    sqlitePath: process.env.SQLITE_PATH || './data/interactions.db',
    cosmos: {
      endpoint: process.env.COSMOS_ENDPOINT || '',
      key: process.env.COSMOS_KEY || '',
      database: process.env.COSMOS_DATABASE || 'photoshare',
      containerComments: process.env.COSMOS_CONTAINER_COMMENTS || 'comments',
      containerRatings: process.env.COSMOS_CONTAINER_RATINGS || 'ratings',
      containerImages: process.env.COSMOS_CONTAINER_IMAGES || 'images',
    },
  },
  search: {
    mode: process.env.SEARCH_MODE || 'local',
    azureEndpoint: process.env.AZURE_SEARCH_ENDPOINT || '',
    azureKey: process.env.AZURE_SEARCH_KEY || '',
    azureIndex: process.env.AZURE_SEARCH_INDEX || 'images-index',
    enabled: !!(process.env.AZURE_SEARCH_ENDPOINT && process.env.AZURE_SEARCH_KEY),
  },
  authImageServiceUrl: process.env.AUTH_IMAGE_SERVICE_URL || 'http://auth-image-service:8080',
  appInsights: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    enabled: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
};

module.exports = config;
