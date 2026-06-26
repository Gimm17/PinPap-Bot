// src/core/storage/sqlite.js
// SQLite Storage adapter untuk PAP Bot (menggunakan sql.js)

import initSqlJs from 'sql.js';
import fs from 'fs';
import path from 'path';
import { getLogger } from '../../utils/logger.js';

const log = getLogger();

let SQL = null;
let db = null;

/**
 * Initialize SQL.js
 */
async function initDatabase() {
  if (db) return db;

  try {
    SQL = await initSqlJs();

    const dbPath = process.env.DATABASE_PATH || './data/papbot.db';
    const dbDir = path.dirname(dbPath);

    // Ensure directory exists
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    // Try to load existing database
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      db = new SQL.Database(buffer);
    } else {
      db = new SQL.Database();
    }

    // Create tables
    createTables();

    log.info('storage', 'SQLite (sql.js) initialized successfully');
    return db;
  } catch (err) {
    log.stack('storage', 'Failed to initialize SQLite', err);
    throw err;
  }
}

/**
 * Create database tables
 */
function createTables() {
  // Channels/Rooms table
  db.run(`
    CREATE TABLE IF NOT EXISTS channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      mode TEXT DEFAULT 'ROUND',
      is_open INTEGER DEFAULT 0,
      ends_at INTEGER,
      quota INTEGER DEFAULT 5,
      member_cap INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      updated_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(guild_id, channel_id)
    )
  `);

  // Submissions table
  db.run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      file_key TEXT NOT NULL,
      file_name TEXT,
      content_type TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(guild_id, channel_id, user_id)
    )
  `);

  // Members table
  db.run(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      joined_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(guild_id, channel_id, user_id)
    )
  `);

  // Pairs table (SWAP mode)
  db.run(`
    CREATE TABLE IF NOT EXISTS pairs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user1_id TEXT NOT NULL,
      user2_id TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(guild_id, channel_id, user1_id),
      UNIQUE(guild_id, channel_id, user2_id)
    )
  `);

  // Queue table (CHAIN mode)
  db.run(`
    CREATE TABLE IF NOT EXISTS queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      position INTEGER NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      UNIQUE(guild_id, channel_id, user_id)
    )
  `);

  // Statistics table
  db.run(`
    CREATE TABLE IF NOT EXISTS statistics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id TEXT NOT NULL,
      channel_id TEXT,
      user_id TEXT,
      action TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Blobs table (file storage)
  db.run(`
    CREATE TABLE IF NOT EXISTS blobs (
      key TEXT PRIMARY KEY,
      buffer BLOB NOT NULL,
      name TEXT,
      content_type TEXT,
      guild_id TEXT,
      channel_id TEXT,
      user_id TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  saveDatabase();
}

/**
 * Save database to file
 */
function saveDatabase() {
  if (!db) return;

  try {
    const dbPath = process.env.DATABASE_PATH || './data/papbot.db';
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    log.error('storage', 'Failed to save database', err);
  }
}

/**
 * SQLite Storage Adapter
 */
class SQLiteStorage {
  constructor() {
    this.initialized = false;
  }

  /**
   * Initialize database
   */
  async init() {
    if (this.initialized) return;
    await initDatabase();
    this.initialized = true;
  }

  /**
   * Save a file submission
   */
  async save(guildId, channelId, userId, fileMeta) {
    await this.init();

    const key = fileMeta.key || `${guildId}:${channelId}:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    // Insert blob
    db.run(
      'INSERT OR REPLACE INTO blobs (key, buffer, name, content_type, guild_id, channel_id, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [key, fileMeta.buffer, fileMeta.name, fileMeta.contentType, guildId, channelId, userId]
    );

    // Insert submission record
    db.run(
      'INSERT OR REPLACE INTO submissions (guild_id, channel_id, user_id, file_key, file_name, content_type) VALUES (?, ?, ?, ?, ?, ?)',
      [guildId, channelId, userId, key, fileMeta.name, fileMeta.contentType]
    );

    saveDatabase();

    return {
      key,
      name: fileMeta.name,
      contentType: fileMeta.contentType,
    };
  }

  /**
   * Load a file by key
   */
  async load(key) {
    await this.init();

    const rows = db.exec('SELECT buffer FROM blobs WHERE key = ?', [key]);

    if (!rows.length || !rows[0].values.length) {
      throw new Error('File tidak ditemukan / sudah terhapus.');
    }

    return Buffer.from(rows[0].values[0][0]);
  }

  /**
   * Purge all data for a channel
   */
  async purgeChannel(guildId, channelId) {
    await this.init();

    db.run('DELETE FROM channels WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
    db.run('DELETE FROM submissions WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
    db.run('DELETE FROM members WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
    db.run('DELETE FROM pairs WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
    db.run('DELETE FROM queue WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);
    db.run('DELETE FROM blobs WHERE guild_id = ? AND channel_id = ?', [guildId, channelId]);

    saveDatabase();
    log.info('storage', `Purged channel: ${guildId}:${channelId}`);
  }

  /**
   * Get channel state
   */
  async getChannelState(guildId, channelId, createIfMissing = false) {
    await this.init();

    const rows = db.exec(
      'SELECT * FROM channels WHERE guild_id = ? AND channel_id = ?',
      [guildId, channelId]
    );

    if (!rows.length || !rows[0].values.length) {
      if (createIfMissing) {
        db.run(
          'INSERT INTO channels (guild_id, channel_id, owner_id, mode, is_open, quota) VALUES (?, ?, ?, "ROUND", 0, 5)',
          [guildId, channelId, 'SYSTEM']
        );
        saveDatabase();
        return this.getChannelState(guildId, channelId, false);
      }
      return null;
    }

    const row = rows[0].values[0];
    const columns = rows[0].columns;
    const state = {};

    columns.forEach((col, i) => {
      state[col] = row[i];
    });

    // Convert to proper types
    state.isOpen = !!state.is_open;
    state.endsAt = state.ends_at ? new Date(state.ends_at * 1000) : null;

    // Load related data
    state.submissions = await this.getSubmissions(guildId, channelId);
    state.members = await this.getMembers(guildId, channelId);
    state.pairs = await this.getPairs(guildId, channelId);
    state.queue = await this.getQueue(guildId, channelId);

    return state;
  }

  /**
   * Update channel state
   */
  async updateChannelState(guildId, channelId, data) {
    await this.init();

    const updates = [];
    const values = [];

    if (data.owner_id !== undefined) {
      updates.push('owner_id = ?');
      values.push(data.owner_id);
    }
    if (data.mode !== undefined) {
      updates.push('mode = ?');
      values.push(data.mode);
    }
    if (data.isOpen !== undefined) {
      updates.push('is_open = ?');
      values.push(data.isOpen ? 1 : 0);
    }
    if (data.endsAt !== undefined) {
      updates.push('ends_at = ?');
      values.push(data.endsAt ? Math.floor(data.endsAt.getTime() / 1000) : null);
    }
    if (data.quota !== undefined) {
      updates.push('quota = ?');
      values.push(data.quota);
    }
    if (data.memberCap !== undefined) {
      updates.push('member_cap = ?');
      values.push(data.memberCap);
    }

    updates.push('updated_at = strftime("%s", "now")');
    values.push(guildId, channelId);

    db.run(`UPDATE channels SET ${updates.join(', ')} WHERE guild_id = ? AND channel_id = ?`, values);
    saveDatabase();

    return true;
  }

  /**
   * Get submissions for a channel
   */
  async getSubmissions(guildId, channelId) {
    await this.init();

    const rows = db.exec(
      'SELECT user_id, file_key, file_name, content_type, created_at FROM submissions WHERE guild_id = ? AND channel_id = ?',
      [guildId, channelId]
    );

    const map = new Map();

    if (rows.length && rows[0].values.length) {
      rows[0].values.forEach(row => {
        map.set(row[0], {
          file: {
            key: row[1],
            name: row[2],
            contentType: row[3],
          },
          at: new Date(row[4] * 1000),
        });
      });
    }

    return map;
  }

  /**
   * Get members for a channel
   */
  async getMembers(guildId, channelId) {
    await this.init();

    const rows = db.exec(
      'SELECT user_id FROM members WHERE guild_id = ? AND channel_id = ?',
      [guildId, channelId]
    );

    const set = new Set();

    if (rows.length && rows[0].values.length) {
      rows[0].values.forEach(row => set.add(row[0]));
    }

    return set;
  }

  /**
   * Get pairs for SWAP mode
   */
  async getPairs(guildId, channelId) {
    await this.init();

    const rows = db.exec(
      'SELECT user1_id, user2_id FROM pairs WHERE guild_id = ? AND channel_id = ?',
      [guildId, channelId]
    );

    const map = new Map();

    if (rows.length && rows[0].values.length) {
      rows[0].values.forEach(row => {
        map.set(row[0], row[1]);
        map.set(row[1], row[0]);
      });
    }

    return map;
  }

  /**
   * Get queue for CHAIN mode
   */
  async getQueue(guildId, channelId) {
    await this.init();

    const rows = db.exec(
      'SELECT user_id FROM queue WHERE guild_id = ? AND channel_id = ? ORDER BY position',
      [guildId, channelId]
    );

    if (!rows.length || !rows[0].values.length) {
      return [];
    }

    return rows[0].values.map(row => row[0]);
  }

  /**
   * Close database connection
   */
  close() {
    if (db) {
      saveDatabase();
      db.close();
      db = null;
    }
  }
}

export { SQLiteStorage };
export default SQLiteStorage;