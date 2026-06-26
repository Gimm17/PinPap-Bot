// src/core/storage/index.js
// Storage adapter - uses memory by default, SQLite if configured

import { getLogger } from '../../utils/logger.js';
import { saveBlob, loadBlob, purgeChannelBlobs, getChannelState, resetRound, closeRound } from './memory.js';

const log = getLogger();

// Default to memory storage
let Storage = {
  async save(guildId, channelId, userId, fileMeta) {
    return saveBlob(guildId, channelId, userId, fileMeta);
  },
  async load(key) {
    return loadBlob(key);
  },
  async purgeChannel(guildId, channelId) {
    return purgeChannelBlobs(guildId, channelId);
  },
};

// Export memory functions for backward compatibility
export { getChannelState, resetRound, closeRound };

// Export Storage
export { Storage };
export default Storage;