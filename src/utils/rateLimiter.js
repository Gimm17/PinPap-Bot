// src/utils/rateLimiter.js
// Rate limiting untuk PAP Bot

/**
 * Rate Limiter Class
 * Prevents spam and abuse
 */
class RateLimiter {
  constructor() {
    // Map<userId, Map<action, {count, resetTime}>>
    this.limits = new Map();

    // Default limits per action type
    this.defaultLimits = {
      submit: { max: 5, window: 60000 },      // 5 submissions per minute
      view: { max: 20, window: 60000 },        // 20 views per minute
      create: { max: 3, window: 300000 },      // 3 room creates per 5 minutes
      command: { max: 30, window: 60000 },      // 30 commands per minute
      admin: { max: 10, window: 300000 },       // 10 admin actions per 5 minutes
    };

    // Cleanup interval (every 5 minutes)
    this.cleanupInterval = setInterval(() => this.cleanup(), 300000);
  }

  /**
   * Check if action is allowed
   * @param {string} userId - Discord user ID
   * @param {string} action - Action type (submit, view, create, command, admin)
   * @param {Object} customLimit - Optional custom limit { max, window }
   * @returns {Object} { allowed: boolean, remaining?: number, resetTime?: number }
   */
  check(userId, action, customLimit = null) {
    const limit = customLimit || this.defaultLimits[action];

    if (!limit) {
      console.warn(`[rateLimiter] Unknown action: ${action}`);
      return { allowed: true };
    }

    const now = Date.now();
    const { max, window } = limit;

    // Get or create user limits
    if (!this.limits.has(userId)) {
      this.limits.set(userId, new Map());
    }

    const userLimits = this.limits.get(userId);

    // Get or create action limit
    if (!userLimits.has(action)) {
      userLimits.set(action, { count: 0, resetTime: now + window });
    }

    let record = userLimits.get(action);

    // Reset if window expired
    if (now > record.resetTime) {
      record = { count: 0, resetTime: now + window };
      userLimits.set(action, record);
    }

    // Check if allowed
    if (record.count >= max) {
      const waitTime = Math.ceil((record.resetTime - now) / 1000);
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        waitTime,
        message: `Rate limit exceeded. Tunggu ${waitTime} detik.`
      };
    }

    // Increment and allow
    record.count++;
    const remaining = max - record.count;

    return {
      allowed: true,
      remaining,
      resetTime: record.resetTime
    };
  }

  /**
   * Get remaining quota for user action
   * @param {string} userId - Discord user ID
   * @param {string} action - Action type
   * @returns {number} Remaining quota
   */
  getRemaining(userId, action) {
    const limit = this.defaultLimits[action];
    if (!limit) return Infinity;

    const userLimits = this.limits.get(userId);
    if (!userLimits) return limit.max;

    const record = userLimits.get(action);
    if (!record || Date.now() > record.resetTime) return limit.max;

    return Math.max(0, limit.max - record.count);
  }

  /**
   * Reset limits for a user
   * @param {string} userId - Discord user ID
   * @param {string} action - Optional specific action, or all if not specified
   */
  reset(userId, action = null) {
    if (!this.limits.has(userId)) return;

    if (action) {
      this.limits.get(userId).delete(action);
    } else {
      this.limits.delete(userId);
    }
  }

  /**
   * Clean up expired entries
   */
  cleanup() {
    const now = Date.now();
    let cleaned = 0;

    for (const [userId, userLimits] of this.limits.entries()) {
      for (const [action, record] of userLimits.entries()) {
        if (now > record.resetTime) {
          userLimits.delete(action);
          cleaned++;
        }
      }

      // Remove user if no limits left
      if (userLimits.size === 0) {
        this.limits.delete(userId);
      }
    }

    if (cleaned > 0) {
      console.log(`[rateLimiter] Cleaned up ${cleaned} expired entries`);
    }
  }

  /**
   * Get statistics
   * @returns {Object} Statistics object
   */
  getStats() {
    return {
      totalUsers: this.limits.size,
      entries: Array.from(this.limits.entries()).reduce((acc, [userId, actions]) => {
        return acc + actions.size;
      }, 0)
    };
  }

  /**
   * Clear all limits
   */
  clear() {
    this.limits.clear();
  }

  /**
   * Destroy rate limiter
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.clear();
  }
}

/**
 * Global rate limiter instance
 */
const rateLimiter = new RateLimiter();

/**
 * Middleware for Discord interactions
 * @param {Interaction} interaction - Discord interaction
 * @param {string} action - Action type
 * @returns {Object} Rate limit result
 */
export function checkRateLimit(interaction, action) {
  const userId = interaction.user?.id;
  if (!userId) return { allowed: true };

  const result = rateLimiter.check(userId, action);

  if (!result.allowed) {
    console.log(`[rateLimiter] Rate limited: ${userId} for ${action}`);
  }

  return result;
}

/**
 * Rate limit decorator for commands
 */
export function withRateLimit(action, customLimit = null) {
  return function(target, propertyKey, descriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function(...args) {
      const [interaction] = args;
      const userId = interaction?.user?.id;

      if (userId) {
        const result = rateLimiter.check(userId, action, customLimit);

        if (!result.allowed) {
          const content = result.message || 'Rate limit exceeded. Coba lagi nanti.';

          if (interaction.deferred || interaction.replied) {
            await interaction.followUp({ content, ephemeral: true });
          } else {
            await interaction.reply({ content, ephemeral: true });
          }

          return null;
        }
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export { rateLimiter, RateLimiter };
export default rateLimiter;