// src/db/models/channel.js
// Channel/Room model untuk PAP Bot

import database from '../index.js';
import { getLogger } from '../../utils/logger.js';

const log = getLogger();

/**
 * Channel Model
 * Manages PAP room state in database
 */
class ChannelModel {
  /**
   * Get or create channel state
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @param {boolean} createIfMissing - Create if not exists
   * @returns {Object|null} Channel state
   */
  static async getState(guildId, channelId, createIfMissing = false) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT * FROM channels WHERE guild_id = ? AND channel_id = ?
      `);
      let row = stmt.get(guildId, channelId);

      if (!row && createIfMissing) {
        const insert = database.db.prepare(`
          INSERT INTO channels (guild_id, channel_id, owner_id, mode, is_open, quota)
          VALUES (?, ?, ?, 'ROUND', 0, 5)
        `);
        insert.run(guildId, channelId, 'SYSTEM');
        row = stmt.get(guildId, channelId);
      }

      if (!row) return null;

      return {
        ...row,
        isOpen: !!row.is_open,
        endsAt: row.ends_at ? new Date(row.ends_at * 1000) : null,
        submissions: await this.getSubmissions(guildId, channelId),
        members: await this.getMembers(guildId, channelId),
        pairs: await this.getPairs(guildId, channelId),
        queue: await this.getQueue(guildId, channelId),
      };
    }

    if (database.type === 'mongodb') {
      const filter = { guild_id: guildId, channel_id: channelId };
      let doc = await database.db.collection('channels').findOne(filter);

      if (!doc && createIfMissing) {
        await database.db.collection('channels').insertOne({
          guild_id: guildId,
          channel_id: channelId,
          owner_id: 'SYSTEM',
          mode: 'ROUND',
          is_open: false,
          quota: 5,
          created_at: new Date(),
          updated_at: new Date(),
        });
        doc = await database.db.collection('channels').findOne(filter);
      }

      if (!doc) return null;

      return {
        ...doc,
        isOpen: doc.is_open,
        submissions: await this.getSubmissions(guildId, channelId),
        members: await this.getMembers(guildId, channelId),
        pairs: await this.getPairs(guildId, channelId),
        queue: await this.getQueue(guildId, channelId),
      };
    }

    // Memory fallback
    const key = `${guildId}:${channelId}`;
    if (!database.db.channels.has(key) && createIfMissing) {
      database.db.channels.set(key, {
        guild_id: guildId,
        channel_id: channelId,
        owner_id: null,
        mode: 'ROUND',
        isOpen: false,
        endsAt: null,
        quota: 5,
        memberCap: null,
        submissions: new Map(),
        members: new Set(),
        pairs: new Map(),
        queue: [],
      });
    }

    return database.db.channels.get(key) || null;
  }

  /**
   * Update channel state
   * @param {string} guildId - Discord guild ID
   * @param {string} channelId - Discord channel ID
   * @param {Object} data - Data to update
   */
  static async updateState(guildId, channelId, data) {
    if (database.type === 'sqlite') {
      const fields = [];
      const values = [];

      if (data.owner_id !== undefined) {
        fields.push('owner_id = ?');
        values.push(data.owner_id);
      }
      if (data.mode !== undefined) {
        fields.push('mode = ?');
        values.push(data.mode);
      }
      if (data.isOpen !== undefined) {
        fields.push('is_open = ?');
        values.push(data.isOpen ? 1 : 0);
      }
      if (data.endsAt !== undefined) {
        fields.push('ends_at = ?');
        values.push(data.endsAt ? Math.floor(data.endsAt.getTime() / 1000) : null);
      }
      if (data.quota !== undefined) {
        fields.push('quota = ?');
        values.push(data.quota);
      }
      if (data.memberCap !== undefined) {
        fields.push('member_cap = ?');
        values.push(data.memberCap);
      }

      fields.push('updated_at = strftime("%s", "now")');

      values.push(guildId, channelId);

      const stmt = database.db.prepare(`
        UPDATE channels SET ${fields.join(', ')} WHERE guild_id = ? AND channel_id = ?
      `);
      stmt.run(...values);

      return true;
    }

    if (database.type === 'mongodb') {
      const update = { $set: { ...data, updated_at: new Date() } };
      await database.db.collection('channels').updateOne(
        { guild_id: guildId, channel_id: channelId },
        update
      );
      return true;
    }

    // Memory fallback
    const key = `${guildId}:${channelId}`;
    const existing = database.db.channels.get(key) || {};

    database.db.channels.set(key, {
      ...existing,
      guild_id: guildId,
      channel_id: channelId,
      ...data,
    });

    return true;
  }

  /**
   * Get submissions for a channel
   */
  static async getSubmissions(guildId, channelId) {
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

    // Memory
    return database.db.submissions.get(`${guildId}:${channelId}`) || new Map();
  }

  /**
   * Get members for a channel
   */
  static async getMembers(guildId, channelId) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT user_id FROM members WHERE guild_id = ? AND channel_id = ?
      `);
      const rows = stmt.all(guildId, channelId);
      return new Set(rows.map(r => r.user_id));
    }

    if (database.type === 'mongodb') {
      const docs = await database.db.collection('members')
        .find({ guild_id: guildId, channel_id: channelId })
        .toArray();
      return new Set(docs.map(d => d.user_id));
    }

    // Memory
    const key = `${guildId}:${channelId}`;
    return database.db.members.get(key) || new Set();
  }

  /**
   * Get pairs for SWAP mode
   */
  static async getPairs(guildId, channelId) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT user1_id, user2_id FROM pairs WHERE guild_id = ? AND channel_id = ?
      `);
      const rows = stmt.all(guildId, channelId);
      const map = new Map();
      rows.forEach(row => {
        map.set(row.user1_id, row.user2_id);
        map.set(row.user2_id, row.user1_id);
      });
      return map;
    }

    if (database.type === 'mongodb') {
      const docs = await database.db.collection('pairs')
        .find({ guild_id: guildId, channel_id: channelId })
        .toArray();
      const map = new Map();
      docs.forEach(doc => {
        map.set(doc.user1_id, doc.user2_id);
        map.set(doc.user2_id, doc.user1_id);
      });
      return map;
    }

    // Memory
    return database.db.pairs.get(`${guildId}:${channelId}`) || new Map();
  }

  /**
   * Get queue for CHAIN mode
   */
  static async getQueue(guildId, channelId) {
    if (database.type === 'sqlite') {
      const stmt = database.db.prepare(`
        SELECT user_id FROM queue WHERE guild_id = ? AND channel_id = ? ORDER BY position
      `);
      const rows = stmt.all(guildId, channelId);
      return rows.map(r => r.user_id);
    }

    if (database.type === 'mongodb') {
      const docs = await database.db.collection('queue')
        .find({ guild_id: guildId, channel_id: channelId })
        .sort({ position: 1 })
        .toArray();
      return docs.map(d => d.user_id);
    }

    // Memory
    return database.db.queue.get(`${guildId}:${channelId}`) || [];
  }

  /**
   * Purge channel data
   */
  static async purge(guildId, channelId) {
    if (database.type === 'sqlite') {
      database.db.prepare('DELETE FROM channels WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
      database.db.prepare('DELETE FROM submissions WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
      database.db.prepare('DELETE FROM members WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
      database.db.prepare('DELETE FROM pairs WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
      database.db.prepare('DELETE FROM queue WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
      database.db.prepare('DELETE FROM blobs WHERE guild_id = ? AND channel_id = ?').run(guildId, channelId);
      return true;
    }

    if (database.type === 'mongodb') {
      await database.db.collection('channels').deleteMany({ guild_id: guildId, channel_id: channelId });
      await database.db.collection('submissions').deleteMany({ guild_id: guildId, channel_id: channelId });
      await database.db.collection('members').deleteMany({ guild_id: guildId, channel_id: channelId });
      await database.db.collection('pairs').deleteMany({ guild_id: guildId, channel_id: channelId });
      await database.db.collection('queue').deleteMany({ guild_id: guildId, channel_id: channelId });
      await database.db.collection('blobs').deleteMany({ guild_id: guildId, channel_id: channelId });
      return true;
    }

    // Memory
    database.db.channels.delete(`${guildId}:${channelId}`);
    database.db.submissions.delete(`${guildId}:${channelId}`);
    database.db.members.delete(`${guildId}:${channelId}`);
    database.db.pairs.delete(`${guildId}:${channelId}`);
    database.db.queue.delete(`${guildId}:${channelId}`);

    // Delete blobs
    for (const [key, blob] of database.db.blobs.entries()) {
      if (blob.guild_id === guildId && blob.channel_id === channelId) {
        database.db.blobs.delete(key);
      }
    }

    return true;
  }
}

export default ChannelModel;