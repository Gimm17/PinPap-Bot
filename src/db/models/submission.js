// src/db/models/submission.js
// Submission model untuk PAP Bot

import database from '../index.js';
import { getLogger } from '../../utils/logger.js';

const log = getLogger();

/**
 * Submission Model
 * Manages PAP submissions in database
 */
class SubmissionModel {
  /**
   * Save a submission
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @param {string} userId - Discord user ID
   * @param {Object} fileMeta - File metadata { key, name, contentType, buffer }
   * @returns {Object} Saved submission
   */
  static async save(guildId, channelId, userId, fileMeta) {
    const key = fileMeta.key || `${guildId}:${channelId}:${userId}:${Date.now()}:${Math.random().toString(36).slice(2, 8)}`;

    if (database.type === 'sqlite') {
      // Save blob
      const blobStmt = database.db.prepare(`
        INSERT OR REPLACE INTO blobs (key, buffer, name, content_type, guild_id, channel_id, user_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      blobStmt.run(key, fileMeta.buffer, fileMeta.name, fileMeta.contentType, guildId, channelId, userId);

      // Save submission record
      const subStmt = database.db.prepare(`
        INSERT OR REPLACE INTO submissions (guild_id, channel_id, user_id, file_key, file_name, content_type)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      subStmt.run(guildId, channelId, userId, key, fileMeta.name, fileMeta.contentType);

      return {
        key,
        name: fileMeta.name,
        contentType: fileMeta.contentType,
      };
    }

    if (database.type === 'mongodb') {
      // Save blob
      await database.db.collection('blobs').updateOne(
        { key },
        {
          $set: {
            key,
            buffer: fileMeta.buffer,
            name: fileMeta.name,
            content_type: fileMeta.contentType,
            guild_id: guildId,
            channel_id: channelId,
            user_id: userId,
            created_at: new Date(),
          }
        },
        { upsert: true }
      );

      // Save submission record
      await database.db.collection('submissions').updateOne(
        { guild_id: guildId, channel_id: channelId, user_id: userId },
        {
          $set: {
            file_key: key,
            file_name: fileMeta.name,
            content_type: fileMeta.contentType,
            created_at: new Date(),
          }
        },
        { upsert: true }
      );

      return {
        key,
        name: fileMeta.name,
        contentType: fileMeta.contentType,
      };
    }

    // Memory fallback
    const submissionKey = `${guildId}:${channelId}:${userId}`;

    if (!database.db.submissions.has(submissionKey)) {
      database.db.submissions.set(submissionKey, new Map());
    }

    database.db.submissions.get(submissionKey).set(userId, {
      file: {
        key,
        name: fileMeta.name,
        contentType: fileMeta.contentType,
      },
      at: new Date(),
    });

    // Save blob
    database.db.blobs.set(key, {
      buffer: fileMeta.buffer,
      name: fileMeta.name,
      contentType: fileMeta.contentType,
      guild_id: guildId,
      channel_id: channelId,
      user_id: userId,
    });

    return {
      key,
      name: fileMeta.name,
      contentType: fileMeta.contentType,
    };
  }

  /**
   * Load a submission file
   * @param {string} key - File key
   * @returns {Buffer} File buffer
   */
  static async load(key) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare('SELECT buffer FROM blobs WHERE key = ?');
      const row = stmt.get(key);

      if (!row) {
        throw new Error('File tidak ditemukan / sudah terhapus.');
      }

      return row.buffer;
    }

    if (database.type === 'mongodb') {
      const doc = await database.db.collection('blobs').findOne({ key });

      if (!doc) {
        throw new Error('File tidak ditemukan / sudah terhapus.');
      }

      return doc.buffer.buffer;
    }

    // Memory fallback
    const blob = database.db.blobs.get(key);

    if (!blob) {
      throw new Error('File tidak ditemukan / sudah terhapus.');
    }

    return Buffer.from(blob.buffer);
  }

  /**
   * Get submission by user
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @param {string} userId - Discord user ID
   * @returns {Object|null} Submission data
   */
  static async getByUser(guildId, channelId, userId) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT file_key, file_name, content_type, created_at
        FROM submissions WHERE guild_id = ? AND channel_id = ? AND user_id = ?
      `);
      const row = stmt.get(guildId, channelId, userId);

      if (!row) return null;

      return {
        file: {
          key: row.file_key,
          name: row.file_name,
          contentType: row.content_type,
        },
        at: new Date(row.created_at * 1000),
      };
    }

    if (database.type === 'mongodb') {
      const doc = await database.db.collection('submissions').findOne({
        guild_id: guildId,
        channel_id: channelId,
        user_id: userId,
      });

      if (!doc) return null;

      return {
        file: {
          key: doc.file_key,
          name: doc.file_name,
          contentType: doc.content_type,
        },
        at: doc.created_at,
      };
    }

    // Memory fallback
    const key = `${guildId}:${channelId}`;
    const submissions = database.db.submissions.get(key);

    if (!submissions) return null;

    return submissions.get(userId) || null;
  }

  /**
   * Get all submissions for a channel
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @returns {Map} Map of userId -> submission
   */
  static async getAll(guildId, channelId) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT user_id, file_key, file_name, content_type, created_at
        FROM submissions WHERE guild_id = ? AND channel_id = ?
      `);
      const rows = stmt.all(guildId, channelId);
      const map = new Map();

      rows.forEach(row => {
        map.set(row.user_id, {
          file: {
            key: row.file_key,
            name: row.file_name,
            contentType: row.content_type,
          },
          at: new Date(row.created_at * 1000),
        });
      });

      return map;
    }

    if (database.type === 'mongodb') {
      const docs = await database.db.collection('submissions')
        .find({ guild_id: guildId, channel_id: channelId })
        .toArray();
      const map = new Map();

      docs.forEach(doc => {
        map.set(doc.user_id, {
          file: {
            key: doc.file_key,
            name: doc.file_name,
            contentType: doc.content_type,
          },
          at: doc.created_at,
        });
      });

      return map;
    }

    // Memory fallback
    const key = `${guildId}:${channelId}`;
    return database.db.submissions.get(key) || new Map();
  }

  /**
   * Delete a submission
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @param {string} userId - Discord user ID
   */
  static async delete(guildId, channelId, userId) {
    if (database.type === 'sqlite') {
      // Get file key first
      const getKeyStmt = database.db.prepare(`
        SELECT file_key FROM submissions WHERE guild_id = ? AND channel_id = ? AND user_id = ?
      `);
      const row = getKeyStmt.get(guildId, channelId, userId);

      if (row) {
        // Delete blob
        database.db.prepare('DELETE FROM blobs WHERE key = ?').run(row.file_key);

        // Delete submission
        database.db.prepare(`
          DELETE FROM submissions WHERE guild_id = ? AND channel_id = ? AND user_id = ?
        `).run(guildId, channelId, userId);
      }

      return true;
    }

    if (database.type === 'mongodb') {
      // Get file key first
      const doc = await database.db.collection('submissions').findOne({
        guild_id: guildId,
        channel_id: channelId,
        user_id: userId,
      });

      if (doc) {
        // Delete blob
        await database.db.collection('blobs').deleteOne({ key: doc.file_key });

        // Delete submission
        await database.db.collection('submissions').deleteOne({
          guild_id: guildId,
          channel_id: channelId,
          user_id: userId,
        });
      }

      return true;
    }

    // Memory fallback
    const key = `${guildId}:${channelId}`;
    const submissions = database.db.submissions.get(key);

    if (submissions && submissions.has(userId)) {
      const sub = submissions.get(userId);
      if (sub?.file?.key) {
        database.db.blobs.delete(sub.file.key);
      }
      submissions.delete(userId);
    }

    return true;
  }

  /**
   * Count submissions in a channel
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @returns {number} Submission count
   */
  static async count(guildId, channelId) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT COUNT(*) as count FROM submissions WHERE guild_id = ? AND channel_id = ?
      `);
      const row = stmt.get(guildId, channelId);
      return row?.count || 0;
    }

    if (database.type === 'mongodb') {
      return await database.db.collection('submissions').countDocuments({
        guild_id: guildId,
        channel_id: channelId,
      });
    }

    // Memory fallback
    const key = `${guildId}:${channelId}`;
    const submissions = database.db.submissions.get(key);
    return submissions?.size || 0;
  }
}

export default SubmissionModel;