// src/db/index.js
// Database connection dan initialization untuk PAP Bot (menggunakan sql.js)

import { getLogger } from '../utils/logger.js';

const log = getLogger();

/**
 * Database Manager Class (Memory-only untuk development)
 */
class Database {
  constructor() {
    this.type = 'memory';
    this.connected = false;
    this.data = {
      channels: new Map(),
      submissions: new Map(),
      members: new Map(),
      pairs: new Map(),
      queue: new Map(),
      statistics: [],
      blobs: new Map(),
    };
  }

  /**
   * Initialize database connection
   */
  async init(type = 'memory', options = {}) {
    this.type = type.toLowerCase();

    try {
      // We use memory storage by default, SQLite adapter handles its own initialization
      this.connected = true;
      log.info('db', `Database initialized: ${this.type}`);
      return true;
    } catch (err) {
      log.stack('db', 'Failed to initialize database', err);
      throw err;
    }
  }

  /**
   * Check if database is connected
   */
  isConnected() {
    return this.connected;
  }

  /**
   * Close database connection
   */
  async close() {
    this.connected = false;
    log.info('db', 'Database connection closed');
  }
}

// Singleton instance
const database = new Database();

export { Database };
export default database;