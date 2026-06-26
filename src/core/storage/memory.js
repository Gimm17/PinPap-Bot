// src/core/storage/memory.js

// ================== STATE ROUND PER CHANNEL ==================
const CHANNELS = new Map(); // key: `${gid}:${cid}` -> state

export function getChannelState(guildId, channelId, createIfMissing = false) {
  const k = `${guildId}:${channelId}`;
  let st = CHANNELS.get(k);
  if (!st && createIfMissing) {
    st = {
      // konfigurasi dasar
      mode: "ROUND",
      isOpen: false,
      endsAt: null,
      quota: 5,

      // data round
      submissions: new Map(), // userId -> { file:{name,contentType,key}, at:Date }

      // owner room
      ownerId: null,

      // opsi tambahan
      _defaultDurationMin: null,

      // membership (kapasitas)
      members: new Set(), // userIds
      memberCap: null, // null = unlimited

      // mode spesifik
      pairs: new Map(), // SWAP: userId -> partnerId
      queue: [], // CHAIN: urutan userId
    };
    CHANNELS.set(k, st);
  }
  return st || null;
}

export function resetRound(st) {
  st.isOpen = true;
  st.endsAt = null;
  st.submissions = new Map();
  st.pairs = new Map();
  st.queue = [];
}

export function closeRound(st) {
  st.isOpen = false;
}

// ================== BLOB STORE (MEMORY ONLY) ==================
// key unik -> { buffer, name, contentType, gid, cid, uid }
const BLOBS = new Map();

function toBuffer(any) {
  if (!any) return Buffer.alloc(0);
  if (Buffer.isBuffer(any)) return any;
  if (any instanceof Uint8Array) return Buffer.from(any);
  if (typeof any === "string") return Buffer.from(any);
  return Buffer.from([]);
}

/** Simpan file ke memori.
 * fileMeta: { name, contentType, buffer|data|body }
 * return: { key, name, contentType }
 */
export async function saveBlob(guildId, channelId, userId, fileMeta) {
  const buf = toBuffer(fileMeta.buffer || fileMeta.data || fileMeta.body);
  const key = `${guildId}:${channelId}:${userId}:${Date.now()}:${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  BLOBS.set(key, {
    buffer: buf,
    name: fileMeta.name || "image",
    contentType: fileMeta.contentType || "application/octet-stream",
    gid: guildId,
    cid: channelId,
    uid: userId,
  });
  return {
    key,
    name: fileMeta.name || "image",
    contentType: fileMeta.contentType || "application/octet-stream",
  };
}

export async function loadBlob(key) {
  const rec = BLOBS.get(key);
  if (!rec) throw new Error("File tidak ditemukan / sudah terhapus.");
  return Buffer.from(rec.buffer);
}

export function purgeChannelBlobs(guildId, channelId) {
  for (const [k, v] of BLOBS.entries()) {
    if (v.gid === guildId && v.cid === channelId) BLOBS.delete(k);
  }
}
