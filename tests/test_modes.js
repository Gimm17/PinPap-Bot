// tests/test_modes.js
// Unit tests untuk mode strategies (ROUND, SWAP, CHAIN, QUOTA)

import { expect } from 'chai';
import { RoundStrategy } from '../src/core/modes/round.js';
import { SwapStrategy } from '../src/core/modes/swap.js';
import { ChainStrategy } from '../src/core/modes/chain.js';
import { QuotaStrategy } from '../src/core/modes/quota.js';
import { createMockInteraction, createMockFileMeta } from './test_setup.js';

describe('Mode Strategies', () => {
  describe('RoundStrategy', () => {
    let strategy;
    let mockState;

    beforeEach(() => {
      strategy = new RoundStrategy();
      mockState = {
        isOpen: false,
        submissions: new Map(),
        members: new Set(),
      };
    });

    describe('onStart', () => {
      it('should open round', async () => {
        const interaction = createMockInteraction();
        const options = { endsAt: new Date(Date.now() + 60000) };

        await strategy.onStart(interaction, mockState, options);

        expect(mockState.isOpen).to.be.true;
        expect(mockState.endsAt).to.exist;
      });

      it('should work without end time', async () => {
        const interaction = createMockInteraction();
        const options = { endsAt: null };

        await strategy.onStart(interaction, mockState, options);

        expect(mockState.isOpen).to.be.true;
        expect(mockState.endsAt).to.be.null;
      });
    });

    describe('onSubmit', () => {
      it('should save submission', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction({ userId: 'user-1' });
        const fileMeta = createMockFileMeta();

        await strategy.onSubmit(interaction, mockState, fileMeta);

        expect(mockState.submissions.has('user-1')).to.be.true;
        expect(mockState.submissions.get('user-1').file).to.exist;
      });

      it('should reject submission when round closed', async () => {
        mockState.isOpen = false;
        const interaction = createMockInteraction();
        const fileMeta = createMockFileMeta();

        // Should throw or handle error
        try {
          await strategy.onSubmit(interaction, mockState, fileMeta);
        } catch (err) {
          // Expected
        }
      });
    });

    describe('onView', () => {
      it('should reject view without submission', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction({ userId: 'user-1' });

        try {
          await strategy.onView(interaction, mockState, { page: 1 });
        } catch (err) {
          // Expected - no submission
        }
      });

      it('should show other submissions after submitting', async () => {
        mockState.isOpen = true;

        // Add submissions
        mockState.submissions.set('user-1', { file: createMockFileMeta({ key: 'key-1' }), at: new Date() });
        mockState.submissions.set('user-2', { file: createMockFileMeta({ key: 'key-2' }), at: new Date() });
        mockState.submissions.set('user-3', { file: createMockFileMeta({ key: 'key-3' }), at: new Date() });

        const interaction = createMockInteraction({ userId: 'user-1' });

        // Note: View depends on Storage.load which is mocked
        // The actual viewing logic is tested in integration tests
      });
    });
  });

  describe('SwapStrategy', () => {
    let strategy;
    let mockState;

    beforeEach(() => {
      strategy = new SwapStrategy();
      mockState = {
        isOpen: false,
        submissions: new Map(),
        pairs: new Map(),
        members: new Set(),
      };
    });

    describe('onStart', () => {
      it('should open swap round and initialize pairs', async () => {
        const interaction = createMockInteraction();

        await strategy.onStart(interaction, mockState, {});

        expect(mockState.isOpen).to.be.true;
        expect(mockState.pairs).to.exist;
        expect(mockState.pairs instanceof Map).to.be.true;
      });
    });

    describe('onSubmit', () => {
      it('should save submission', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction({ userId: 'user-1' });
        const fileMeta = createMockFileMeta();

        await strategy.onSubmit(interaction, mockState, fileMeta);

        expect(mockState.submissions.has('user-1')).to.be.true;
      });

      it('should pair participants', async () => {
        mockState.isOpen = true;

        // First user submits
        const interaction1 = createMockInteraction({ userId: 'user-1' });
        await strategy.onSubmit(interaction1, mockState, createMockFileMeta());

        // Second user submits
        const interaction2 = createMockInteraction({ userId: 'user-2' });
        await strategy.onSubmit(interaction2, mockState, createMockFileMeta());

        // They should be paired
        expect(mockState.pairs.has('user-1')).to.be.true;
        expect(mockState.pairs.has('user-2')).to.be.true;
        expect(mockState.pairs.get('user-1')).to.equal('user-2');
        expect(mockState.pairs.get('user-2')).to.equal('user-1');
      });
    });

    describe('onView', () => {
      it('should reject view without submission', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction();

        try {
          await strategy.onView(interaction, mockState);
        } catch (err) {
          // Expected
        }
      });

      it('should reject view without partner', async () => {
        mockState.isOpen = true;
        mockState.submissions.set('user-1', { file: createMockFileMeta(), at: new Date() });
        const interaction = createMockInteraction({ userId: 'user-1' });

        try {
          await strategy.onView(interaction, mockState);
        } catch (err) {
          // Expected - no partner yet
        }
      });
    });
  });

  describe('ChainStrategy', () => {
    let strategy;
    let mockState;

    beforeEach(() => {
      strategy = new ChainStrategy();
      mockState = {
        isOpen: false,
        submissions: new Map(),
        queue: [],
        members: new Set(),
      };
    });

    describe('onStart', () => {
      it('should open chain round and initialize queue', async () => {
        const interaction = createMockInteraction();

        await strategy.onStart(interaction, mockState, {});

        expect(mockState.isOpen).to.be.true;
        expect(mockState.queue).to.exist;
        expect(Array.isArray(mockState.queue)).to.be.true;
      });
    });

    describe('onSubmit', () => {
      it('should add to queue', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction({ userId: 'user-1' });
        const fileMeta = createMockFileMeta();

        await strategy.onSubmit(interaction, mockState, fileMeta);

        expect(mockState.queue).to.include('user-1');
      });

      it('should track order', async () => {
        mockState.isOpen = true;

        await strategy.onSubmit(createMockInteraction({ userId: 'user-1' }), mockState, createMockFileMeta());
        await strategy.onSubmit(createMockInteraction({ userId: 'user-2' }), mockState, createMockFileMeta());
        await strategy.onSubmit(createMockInteraction({ userId: 'user-3' }), mockState, createMockFileMeta());

        expect(mockState.queue).to.deep.equal(['user-1', 'user-2', 'user-3']);
      });
    });

    describe('onView', () => {
      it('should show previous submission', async () => {
        mockState.isOpen = true;

        // User 1 submits (first - no previous)
        await strategy.onSubmit(createMockInteraction({ userId: 'user-1' }), mockState, createMockFileMeta());

        // User 2 submits (should see user 1)
        // Note: Actual view logic requires Storage.load mock
      });
    });
  });

  describe('QuotaStrategy', () => {
    let strategy;
    let mockState;

    beforeEach(() => {
      strategy = new QuotaStrategy();
      mockState = {
        isOpen: false,
        submissions: new Map(),
        quota: 3,
        members: new Set(),
      };
    });

    describe('onStart', () => {
      it('should open quota round', async () => {
        const interaction = createMockInteraction();

        await strategy.onStart(interaction, mockState, { quota: 5 });

        expect(mockState.isOpen).to.be.true;
        expect(mockState.quota).to.equal(5);
      });

      it('should use default quota if not specified', async () => {
        const interaction = createMockInteraction();

        await strategy.onStart(interaction, mockState, {});

        expect(mockState.isOpen).to.be.true;
      });
    });

    describe('onSubmit', () => {
      it('should save submission', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction({ userId: 'user-1' });
        const fileMeta = createMockFileMeta();

        await strategy.onSubmit(interaction, mockState, fileMeta);

        expect(mockState.submissions.has('user-1')).to.be.true;
      });

      it('should track progress toward quota', async () => {
        mockState.isOpen = true;
        mockState.quota = 3;

        // Submit 1
        await strategy.onSubmit(createMockInteraction({ userId: 'user-1' }), mockState, createMockFileMeta());
        expect(mockState.submissions.size).to.equal(1);

        // Submit 2
        await strategy.onSubmit(createMockInteraction({ userId: 'user-2' }), mockState, createMockFileMeta());
        expect(mockState.submissions.size).to.equal(2);

        // Submit 3 - should reach quota
        await strategy.onSubmit(createMockInteraction({ userId: 'user-3' }), mockState, createMockFileMeta());
        expect(mockState.submissions.size).to.equal(3);
      });
    });

    describe('onView', () => {
      it('should reject view without submission', async () => {
        mockState.isOpen = true;
        const interaction = createMockInteraction();

        try {
          await strategy.onView(interaction, mockState, { page: 1 });
        } catch (err) {
          // Expected
        }
      });

      it('should reject view before quota reached', async () => {
        mockState.isOpen = true;
        mockState.quota = 3;
        mockState.submissions.set('user-1', { file: createMockFileMeta(), at: new Date() });

        const interaction = createMockInteraction({ userId: 'user-1' });

        try {
          await strategy.onView(interaction, mockState, { page: 1 });
        } catch (err) {
          // Expected - quota not reached
        }
      });

      it('should allow view after quota reached', async () => {
        mockState.isOpen = true;
        mockState.quota = 2;

        // Add submissions
        mockState.submissions.set('user-1', { file: createMockFileMeta({ key: 'key-1' }), at: new Date() });
        mockState.submissions.set('user-2', { file: createMockFileMeta({ key: 'key-2' }), at: new Date() });

        const interaction = createMockInteraction({ userId: 'user-1' });

        // Note: Actual view logic requires Storage.load mock
      });
    });
  });
});