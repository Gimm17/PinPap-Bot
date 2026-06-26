import fetch from 'node-fetch';
import { ALLOWED_MIME, SIZE_LIMIT } from '../config/constants.js';

export async function downloadAttachment(attach) {
  if (attach.contentType && !ALLOWED_MIME.includes(attach.contentType)) {
    throw new Error('File harus berupa gambar (png/jpg/webp/gif).');
  }
  if (attach.size > SIZE_LIMIT) {
    throw new Error('Ukuran gambar melebihi batas 8MB.');
  }
  const res = await fetch(attach.url);
  if (!res.ok) throw new Error('Gagal mengunduh lampiran.');
  const buffer = Buffer.from(await res.arrayBuffer());
  return {
    name: attach.name || `pap-${Date.now()}.png`,
    contentType: attach.contentType || 'image/png',
    buffer
  };
}
