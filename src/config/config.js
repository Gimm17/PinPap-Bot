// src/config/config.js
// Configuration loader untuk PAP Bot

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load and validate environment configuration
 */
export function loadConfig() {
  const config = {
    // Discord
    botToken: process.env.BOT_TOKEN,
    clientId: process.env.CLIENT_ID,

    // Storage
    storage: process.env.STORAGE || 'sqlite',
    databasePath: process.env.DATABASE_PATH || './data/papbot.db',
    mongodbUri: process.env.MONGODB_URI,
    mongodbDbName: process.env.MONGODB_DB_NAME || 'papbot',

    // Web
    webPort: parseInt(process.env.WEB_PORT) || 3000,
    webHost: process.env.WEB_HOST || '0.0.0.0',

    // Rate Limiting
    rateLimitSubmit: parseInt(process.env.RATE_LIMIT_SUBMIT) || 5,
    rateLimitView: parseInt(process.env.RATE_LIMIT_VIEW) || 20,
    rateLimitWindow: parseInt(process.env.RATE_LIMIT_WINDOW) || 60000,

    // Bot Settings
    maxRooms: parseInt(process.env.MAX_ROOMS) || 5,
    defaultCategory: process.env.DEFAULT_CATEGORY || 'papbot',
    defaultLobby: process.env.DEFAULT_LOBBY || 'create-room',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 8 * 1024 * 1024,

    // Logging
    logLevel: process.env.LOG_LEVEL || 'info',
    logFile: process.env.LOG_FILE || './logs/bot.log',

    // Environment
    nodeEnv: process.env.NODE_ENV || 'development',
    debug: process.env.DEBUG === 'true',
  };

  // Validate required fields
  const required = ['botToken', 'clientId'];
  const missing = required.filter(key => !config[key]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Ensure directories exist
  const dataDir = path.dirname(config.databasePath);
  const logsDir = path.dirname(config.logFile);

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  return config;
}

/**
 * Validate Discord token format
 */
export function validateToken(token) {
  if (!token) return false;
  // Discord tokens are base64 encoded strings
  return typeof token === 'string' && token.length > 50;
}

/**
 * Validate client ID format
 */
export function validateClientId(clientId) {
  if (!clientId) return false;
  // Discord client IDs are snowflakes (17-19 digit numbers)
  return /^\d{17,19}$/.test(clientId);
}

/**
 * Get storage adapter based on config
 */
export function getStorageConfig() {
  const storage = process.env.STORAGE || 'sqlite';

  switch (storage.toLowerCase()) {
    case 'memory':
      return { type: 'memory' };
    case 'sqlite':
      return {
        type: 'sqlite',
        path: process.env.DATABASE_PATH || './data/papbot.db'
      };
    case 'mongodb':
      return {
        type: 'mongodb',
        uri: process.env.MONGODB_URI,
        dbName: process.env.MONGODB_DB_NAME || 'papbot'
      };
    default:
      console.warn(`[config] Unknown storage type: ${storage}, falling back to sqlite`);
      return { type: 'sqlite', path: './data/papbot.db' };
  }
}

export default { loadConfig, validateToken, validateClientId, getStorageConfig };