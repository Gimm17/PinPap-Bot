// src/utils/validation.js
// Input validation dan sanitization untuk PAP Bot

import { ALLOWED_MIME, SIZE_LIMIT } from '../config/constants.js';

/**
 * Validate image attachment
 * @param {Attachment} attachment - Discord attachment object
 * @returns {Object} { valid: boolean, error?: string }
 */
export function validateImage(attachment) {
  if (!attachment) {
    return { valid: false, error: 'File tidak ditemukan.' };
  }

  // Check file type
  if (attachment.contentType && !ALLOWED_MIME.includes(attachment.contentType)) {
    return {
      valid: false,
      error: `Tipe file tidak didukung. Hanya: ${ALLOWED_MIME.map(m => m.split('/')[1].toUpperCase()).join(', ')}.`
    };
  }

  // Check file extension
  const ext = attachment.name?.split('.').pop()?.toLowerCase();
  const validExts = ['png', 'jpg', 'jpeg', 'webp', 'gif'];
  if (ext && !validExts.includes(ext)) {
    return {
      valid: false,
      error: `Ekstensi file tidak didukung. Hanya: ${validExts.join(', ')}.`
    };
  }

  // Check file size
  if (attachment.size > SIZE_LIMIT) {
    return {
      valid: false,
      error: `Ukuran file terlalu besar. Maksimal ${SIZE_LIMIT / 1024 / 1024}MB.`
    };
  }

  return { valid: true };
}

/**
 * Validate Discord snowflake ID
 * @param {string} id - Discord ID (user, channel, guild)
 * @returns {boolean}
 */
export function validateSnowflake(id) {
  if (!id || typeof id !== 'string') return false;
  // Discord snowflakes are 17-19 digit numbers
  return /^\d{17,19}$/.test(id);
}

/**
 * Sanitize string input
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string} Sanitized string
 */
export function sanitizeInput(str, maxLength = 100) {
  if (!str) return '';
  return str
    .toString()
    .trim()
    .slice(0, maxLength)
    .replace(/[<>@#]/g, '') // Remove Discord special chars
    .replace(/`/g, ''); // Remove backticks
}

/**
 * Validate mode string
 * @param {string} mode - Mode name
 * @returns {Object} { valid: boolean, mode?: string }
 */
export function validateMode(mode) {
  const VALID_MODES = ['ROUND', 'SWAP', 'CHAIN', 'QUOTA'];
  const upper = mode?.toUpperCase().trim();

  if (!upper || !VALID_MODES.includes(upper)) {
    return { valid: false };
  }

  return { valid: true, mode: upper };
}

/**
 * Validate capacity number
 * @param {number} capacity - Room capacity
 * @returns {Object} { valid: boolean, capacity?: number }
 */
export function validateCapacity(capacity) {
  if (capacity === null || capacity === undefined) {
    return { valid: true, capacity: null }; // unlimited
  }

  const num = parseInt(capacity);
  if (isNaN(num) || num < 0) {
    return { valid: false };
  }

  if (num > 5000) {
    return { valid: true, capacity: 5000 }; // max cap
  }

  return { valid: true, capacity: num };
}

/**
 * Validate page number
 * @param {number} page - Page number
 * @returns {Object} { valid: boolean, page?: number }
 */
export function validatePage(page) {
  if (!page) return { valid: true, page: 1 };

  const num = parseInt(page);
  if (isNaN(num) || num < 1) {
    return { valid: true, page: 1 };
  }

  return { valid: true, page: num };
}

/**
 * Validate duration in minutes
 * @param {number} minutes - Duration in minutes
 * @returns {Object} { valid: boolean, minutes?: number }
 */
export function validateDuration(minutes) {
  if (!minutes) return { valid: true, minutes: null };

  const num = parseInt(minutes);
  if (isNaN(num) || num < 1) {
    return { valid: false };
  }

  // Max 1440 minutes (24 hours)
  if (num > 1440) {
    return { valid: true, minutes: 1440 };
  }

  return { valid: true, minutes: num };
}

/**
 * Validate quota number
 * @param {number} quota - Minimum quota for QUOTA mode
 * @returns {Object} { valid: boolean, quota?: number }
 */
export function validateQuota(quota) {
  if (!quota) return { valid: true, quota: 5 }; // default 5

  const num = parseInt(quota);
  if (isNaN(num) || num < 2) {
    return { valid: false };
  }

  // Max 100
  if (num > 100) {
    return { valid: true, quota: 100 };
  }

  return { valid: true, quota: num };
}

/**
 * Escape markdown in string
 * @param {string} str - Input string
 * @returns {string} Escaped string
 */
export function escapeMarkdown(str) {
  if (!str) return '';
  return str.replace(/([*_~`|\\])/g, '\\$1');
}

/**
 * Truncate string with ellipsis
 * @param {string} str - Input string
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
export function truncate(str, maxLength = 100) {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - 3) + '...';
}

export default {
  validateImage,
  validateSnowflake,
  sanitizeInput,
  validateMode,
  validateCapacity,
  validatePage,
  validateDuration,
  validateQuota,
  escapeMarkdown,
  truncate,
};