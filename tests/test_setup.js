// tests/test_setup.js
// Test setup dan utilities untuk PAP Bot

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';

/**
 * Test database setup
 */
export async function setupTestDatabase() {
  const testDbPath = './data/test_papbot.db';

  // Ensure test directory exists
  const testDir = path.dirname(testDbPath);
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }

  // Remove existing test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  return testDbPath;
}

/**
 * Clean up test database
 */
export async function cleanupTestDatabase(dbPath) {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
  }

  // Also remove WAL and SHM files
  const walPath = `${dbPath}-wal`;
  const shmPath = `${dbPath}-shm`;

  if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
  if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);
}

/**
 * Create mock Discord attachment
 */
export function createMockAttachment(options = {}) {
  return {
    id: options.id || '1234567890',
    name: options.name || 'test-image.png',
    contentType: options.contentType || 'image/png',
    size: options.size || 1024,
    url: options.url || 'https://example.com/test-image.png',
    proxyURL: options.proxyURL || 'https://example.com/test-image.png',
    width: options.width || 100,
    height: options.height || 100,
  };
}

/**
 * Create mock Discord interaction
 */
export function createMockInteraction(options = {}) {
  const userId = options.userId || 'user-123';
  const guildId = options.guildId || 'guild-123';
  const channelId = options.channelId || 'channel-123';

  return {
    id: 'interaction-123',
    user: {
      id: userId,
      tag: options.userTag || 'TestUser#1234',
      username: options.username || 'TestUser',
    },
    guild: {
      id: guildId,
      name: options.guildName || 'Test Guild',
      members: {
        fetch: async (id) => ({
          id,
          permissions: {
            has: () => options.isAdmin || false,
          },
        }),
      },
    },
    guildId,
    channelId,
    channel: {
      id: channelId,
      name: options.channelName || 'test-channel',
      send: async (content) => {
        console.log('[Mock] Channel send:', content);
        return { id: 'msg-123' };
      },
    },
    member: {
      id: userId,
      permissions: {
        has: () => options.isAdmin || false,
      },
    },
    client: {
      user: { id: 'bot-123' },
      guilds: {
        cache: new Map([[guildId, { id: guildId, name: 'Test Guild' }]]),
      },
    },
    commandName: options.commandName || 'pap-test',
    options: {
      getAttachment: (name) => options.attachment || createMockAttachment(),
      getString: (name) => options.stringOptions?.[name] || null,
      getInteger: (name) => options.integerOptions?.[name] || null,
      getSubcommand: () => options.subcommand || null,
      getFocused: (name) => options.focusedValue || '',
    },
    isChatInputCommand: () => true,
    isButton: () => false,
    isModalSubmit: () => false,
    isAutocomplete: () => false,
    inGuild: () => true,
    deferred: false,
    replied: false,
    reply: async (content) => {
      console.log('[Mock] Reply:', content);
      return { id: 'reply-123' };
    },
    followUp: async (content) => {
      console.log('[Mock] FollowUp:', content);
      return { id: 'followup-123' };
    },
    editReply: async (content) => {
      console.log('[Mock] EditReply:', content);
      return { id: 'edit-123' };
    },
    deferReply: async (options) => {
      console.log('[Mock] DeferReply:', options);
      return true;
    },
    showModal: async (modal) => {
      console.log('[Mock] ShowModal:', modal);
      return true;
    },
  };
}

/**
 * Create mock file metadata
 */
export function createMockFileMeta(options = {}) {
  return {
    name: options.name || 'test-image.png',
    contentType: options.contentType || 'image/png',
    buffer: options.buffer || Buffer.from('mock-image-data'),
    key: options.key || `test-key-${Date.now()}`,
  };
}

/**
 * Wait for specified milliseconds
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Assert that a function throws an error
 */
export async function assertThrowsAsync(fn, errorMessage = null) {
  let error = null;
  try {
    await fn();
  } catch (e) {
    error = e;
  }

  expect(error).to.not.be.null;

  if (errorMessage) {
    expect(error.message).to.include(errorMessage);
  }

  return error;
}

/**
 * Generate random ID
 */
export function randomId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Create mock guild
 */
export function createMockGuild(options = {}) {
  return {
    id: options.id || 'guild-123',
    name: options.name || 'Test Guild',
    members: {
      fetch: async (id) => ({
        id,
        permissions: { has: () => options.isAdmin || false },
      }),
    },
    channels: {
      cache: new Map(),
      create: async (opts) => ({
        id: 'new-channel-123',
        name: opts.name,
        ...opts,
      }),
    },
    systemChannel: null,
  };
}

/**
 * Create mock channel
 */
export function createMockChannel(options = {}) {
  return {
    id: options.id || 'channel-123',
    name: options.name || 'test-channel',
    type: options.type || 0, // GuildText
    guildId: options.guildId || 'guild-123',
    parentId: options.parentId || null,
    send: async (content) => {
      console.log('[Mock Channel] Send:', content);
      return { id: 'msg-123' };
    },
    messages: {
      fetchPins: async () => new Map(),
    },
  };
}

export default {
  setupTestDatabase,
  cleanupTestDatabase,
  createMockAttachment,
  createMockInteraction,
  createMockFileMeta,
  wait,
  assertThrowsAsync,
  randomId,
  createMockGuild,
  createMockChannel,
};