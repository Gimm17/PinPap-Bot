// tests/test_rate_limiter.js
// Unit tests untuk rate limiter

import { expect } from 'chai';
import { RateLimiter, rateLimiter, checkRateLimit } from '../src/utils/rateLimiter.js';

describe('Rate Limiter', () => {
  let limiter;

  beforeEach(() => {
    limiter = new RateLimiter();
  });

  afterEach(() => {
    limiter.destroy();
  });

  describe('check', () => {
    it('should allow actions within limit', () => {
      const userId = 'user-123';

      for (let i = 0; i < 5; i++) {
        const result = limiter.check(userId, 'submit');
        expect(result.allowed).to.be.true;
      }
    });

    it('should block actions exceeding limit', () => {
      const userId = 'user-456';

      // Exhaust limit (5 submissions per minute by default)
      for (let i = 0; i < 5; i++) {
        limiter.check(userId, 'submit');
      }

      // Next should be blocked
      const result = limiter.check(userId, 'submit');
      expect(result.allowed).to.be.false;
      expect(result.message).to.include('Rate limit exceeded');
    });

    it('should track remaining quota', () => {
      const userId = 'user-789';

      const result1 = limiter.check(userId, 'submit');
      expect(result1.remaining).to.equal(4);

      const result2 = limiter.check(userId, 'submit');
      expect(result2.remaining).to.equal(3);
    });

    it('should reset after window expires', async () => {
      const userId = 'user-test';
      const customLimit = { max: 2, window: 100 }; // 2 actions per 100ms

      // Use up limit
      limiter.check(userId, 'custom', customLimit);
      limiter.check(userId, 'custom', customLimit);

      // Should be blocked
      let result = limiter.check(userId, 'custom', customLimit);
      expect(result.allowed).to.be.false;

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Should be allowed again
      result = limiter.check(userId, 'custom', customLimit);
      expect(result.allowed).to.be.true;
    });

    it('should handle different action types separately', () => {
      const userId = 'user-actions';

      // Submit actions (limit 5)
      for (let i = 0; i < 5; i++) {
        limiter.check(userId, 'submit');
      }

      // View actions should still be allowed (limit 20)
      const viewResult = limiter.check(userId, 'view');
      expect(viewResult.allowed).to.be.true;

      // Submit should be blocked
      const submitResult = limiter.check(userId, 'submit');
      expect(submitResult.allowed).to.be.false;
    });

    it('should handle different users separately', () => {
      const user1 = 'user-1';
      const user2 = 'user-2';

      // Use up limit for user1
      for (let i = 0; i < 5; i++) {
        limiter.check(user1, 'submit');
      }

      // user2 should still be allowed
      const result = limiter.check(user2, 'submit');
      expect(result.allowed).to.be.true;

      // user1 should be blocked
      const result2 = limiter.check(user1, 'submit');
      expect(result2.allowed).to.be.false;
    });
  });

  describe('getRemaining', () => {
    it('should return correct remaining quota', () => {
      const userId = 'user-remaining';

      expect(limiter.getRemaining(userId, 'submit')).to.equal(5);

      limiter.check(userId, 'submit');
      expect(limiter.getRemaining(userId, 'submit')).to.equal(4);

      limiter.check(userId, 'submit');
      expect(limiter.getRemaining(userId, 'submit')).to.equal(3);
    });

    it('should return max for unknown users', () => {
      expect(limiter.getRemaining('unknown-user', 'submit')).to.equal(5);
    });

    it('should return Infinity for unknown actions', () => {
      expect(limiter.getRemaining('user-123', 'unknown-action')).to.equal(Infinity);
    });
  });

  describe('reset', () => {
    it('should reset specific action for user', () => {
      const userId = 'user-reset';

      // Use up limit
      for (let i = 0; i < 5; i++) {
        limiter.check(userId, 'submit');
      }

      // Reset submit action
      limiter.reset(userId, 'submit');

      // Should be allowed again
      const result = limiter.check(userId, 'submit');
      expect(result.allowed).to.be.true;
    });

    it('should reset all actions for user', () => {
      const userId = 'user-reset-all';

      // Use up limits
      for (let i = 0; i < 5; i++) {
        limiter.check(userId, 'submit');
      }
      for (let i = 0; i < 20; i++) {
        limiter.check(userId, 'view');
      }

      // Reset all
      limiter.reset(userId);

      // Both should be allowed
      expect(limiter.check(userId, 'submit').allowed).to.be.true;
      expect(limiter.check(userId, 'view').allowed).to.be.true;
    });
  });

  describe('cleanup', () => {
    it('should clean up expired entries', async () => {
      const userId = 'user-cleanup';
      const customLimit = { max: 1, window: 50 }; // 1 action per 50ms

      limiter.check(userId, 'custom', customLimit);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 100));

      // Cleanup
      limiter.cleanup();

      // Entry should be removed
      expect(limiter.limits.has(userId)).to.be.false;
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', () => {
      limiter.check('user-1', 'submit');
      limiter.check('user-2', 'submit');
      limiter.check('user-1', 'view');

      const stats = limiter.getStats();
      expect(stats.totalUsers).to.equal(2);
      expect(stats.entries).to.equal(3); // 2 users, 3 action entries
    });
  });

  describe('checkRateLimit function', () => {
    it('should work with mock interaction', () => {
      const mockInteraction = {
        user: { id: 'test-user' },
        deferred: false,
        replied: false,
        reply: async (content) => ({ id: 'reply-123' }),
      };

      const result = checkRateLimit(mockInteraction, 'submit');
      expect(result.allowed).to.be.true;
    });

    it('should return true for missing user', () => {
      const mockInteraction = { user: null };
      const result = checkRateLimit(mockInteraction, 'submit');
      expect(result.allowed).to.be.true;
    });
  });
});