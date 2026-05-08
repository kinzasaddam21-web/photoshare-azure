require('dotenv').config();

const config = {
  port: parseInt(process.env.PORT || '8080', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
  },
  storage: {
    mode: process.env.STORAGE_MODE || 'local',
    localUploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    azureConnectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    azureContainerName: process.env.AZURE_STORAGE_CONTAINER_NAME || 'photos',
  },
  db: {
    mode: process.env.DB_MODE || 'sqlite',
    sqlitePath: process.env.SQLITE_PATH || './data/app.db',
    cosmos: {
      endpoint: process.env.COSMOS_ENDPOINT || '',
      key: process.env.COSMOS_KEY || '',
      database: process.env.COSMOS_DATABASE || 'photoshare',
      containerUsers: process.env.COSMOS_CONTAINER_USERS || 'users',
      containerImages: process.env.COSMOS_CONTAINER_IMAGES || 'images',
    },
  },
  aiVision: {
    endpoint: process.env.AI_VISION_ENDPOINT || '',
    key: process.env.AI_VISION_KEY || '',
    enabled: !!(process.env.AI_VISION_ENDPOINT && process.env.AI_VISION_KEY),
  },
  appInsights: {
    connectionString: process.env.APPLICATIONINSIGHTS_CONNECTION_STRING || '',
    enabled: !!process.env.APPLICATIONINSIGHTS_CONNECTION_STRING,
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  },
  publicBaseUrl: process.env.PUBLIC_BASE_URL || 'http://localhost:8001',
};

module.exports = config;
