// tests/test_validation.js
// Unit tests untuk validation utilities

import { expect } from 'chai';
import {
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
} from '../src/utils/validation.js';
import { SIZE_LIMIT } from '../src/config/constants.js';

describe('Validation Utilities', () => {
  describe('validateImage', () => {
    it('should reject missing attachment', () => {
      const result = validateImage(null);
      expect(result.valid).to.be.false;
      expect(result.error).to.include('tidak ditemukan');
    });

    it('should accept valid image types', () => {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

      validTypes.forEach(type => {
        const result = validateImage({
          name: 'test.png',
          contentType: type,
          size: 1024,
        });
        expect(result.valid).to.be.true;
      });
    });

    it('should reject invalid image types', () => {
      const result = validateImage({
        name: 'test.pdf',
        contentType: 'application/pdf',
        size: 1024,
      });
      expect(result.valid).to.be.false;
      expect(result.error).to.include('Tipe file tidak didukung');
    });

    it('should reject files larger than SIZE_LIMIT', () => {
      const result = validateImage({
        name: 'test.png',
        contentType: 'image/png',
        size: SIZE_LIMIT + 1,
      });
      expect(result.valid).to.be.false;
      expect(result.error).to.include('terlalu besar');
    });

    it('should accept files at SIZE_LIMIT', () => {
      const result = validateImage({
        name: 'test.png',
        contentType: 'image/png',
        size: SIZE_LIMIT,
      });
      expect(result.valid).to.be.true;
    });

    it('should check file extension', () => {
      const result = validateImage({
        name: 'test.exe',
        contentType: 'image/png',
        size: 1024,
      });
      expect(result.valid).to.be.false;
    });
  });

  describe('validateSnowflake', () => {
    it('should accept valid Discord snowflakes', () => {
      expect(validateSnowflake('123456789012345678')).to.be.true;
      expect(validateSnowflake('123456789012345679')).to.be.true;
      expect(validateSnowflake('123456789012345680')).to.be.true;
    });

    it('should reject invalid snowflakes', () => {
      expect(validateSnowflake('')).to.be.false;
      expect(validateSnowflake(null)).to.be.false;
      expect(validateSnowflake('abc')).to.be.false;
      expect(validateSnowflake('123')).to.be.false;
      expect(validateSnowflake('12345678901234567')).to.be.false; // 17 digits is valid
    });
  });

  describe('sanitizeInput', () => {
    it('should remove Discord special characters', () => {
      expect(sanitizeInput('hello@world')).to.equal('helloworld');
      expect(sanitizeInput('test#123')).to.equal('test123');
      expect(sanitizeInput('<@123>')).to.equal('123');
    });

    it('should trim and limit length', () => {
      const long = 'a'.repeat(200);
      expect(sanitizeInput(long, 100)).to.have.lengthOf(100);
      expect(sanitizeInput('  hello  ')).to.equal('hello');
    });

    it('should handle empty/null input', () => {
      expect(sanitizeInput('')).to.equal('');
      expect(sanitizeInput(null)).to.equal('');
      expect(sanitizeInput(undefined)).to.equal('');
    });
  });

  describe('validateMode', () => {
    it('should accept valid modes', () => {
      expect(validateMode('ROUND').valid).to.be.true;
      expect(validateMode('round').valid).to.be.true;
      expect(validateMode('ROUND').mode).to.equal('ROUND');
      expect(validateMode('swap').mode).to.equal('SWAP');
      expect(validateMode('Chain').mode).to.equal('CHAIN');
      expect(validateMode('QUOTA').mode).to.equal('QUOTA');
    });

    it('should reject invalid modes', () => {
      expect(validateMode('INVALID').valid).to.be.false;
      expect(validateMode('').valid).to.be.false;
      expect(validateMode(null).valid).to.be.false;
    });
  });

  describe('validateCapacity', () => {
    it('should accept unlimited capacity (null)', () => {
      const result = validateCapacity(null);
      expect(result.valid).to.be.true;
      expect(result.capacity).to.be.null;
    });

    it('should accept valid capacity numbers', () => {
      expect(validateCapacity(0).capacity).to.equal(0);
      expect(validateCapacity(10).capacity).to.equal(10);
      expect(validateCapacity(100).capacity).to.equal(100);
    });

    it('should cap capacity at 5000', () => {
      expect(validateCapacity(10000).capacity).to.equal(5000);
    });

    it('should reject negative capacity', () => {
      expect(validateCapacity(-1).valid).to.be.false;
    });
  });

  describe('validatePage', () => {
    it('should default to page 1', () => {
      expect(validatePage(null).page).to.equal(1);
      expect(validatePage(undefined).page).to.equal(1);
      expect(validatePage(0).page).to.equal(1);
    });

    it('should accept valid page numbers', () => {
      expect(validatePage(1).page).to.equal(1);
      expect(validatePage(5).page).to.equal(5);
      expect(validatePage(100).page).to.equal(100);
    });

    it('should handle invalid page numbers', () => {
      expect(validatePage(-1).page).to.equal(1);
      expect(validatePage('abc').page).to.equal(1);
    });
  });

  describe('validateDuration', () => {
    it('should accept null duration', () => {
      const result = validateDuration(null);
      expect(result.valid).to.be.true;
      expect(result.minutes).to.be.null;
    });

    it('should accept valid duration', () => {
      expect(validateDuration(5).minutes).to.equal(5);
      expect(validateDuration(60).minutes).to.equal(60);
    });

    it('should cap duration at 24 hours', () => {
      expect(validateDuration(1500).minutes).to.equal(1440);
    });

    it('should reject invalid duration', () => {
      expect(validateDuration(0).valid).to.be.false;
      expect(validateDuration(-5).valid).to.be.false;
    });
  });

  describe('validateQuota', () => {
    it('should default to 5', () => {
      expect(validateQuota(null).quota).to.equal(5);
      expect(validateQuota(undefined).quota).to.equal(5);
    });

    it('should accept valid quota', () => {
      expect(validateQuota(2).quota).to.equal(2);
      expect(validateQuota(10).quota).to.equal(10);
    });

    it('should cap quota at 100', () => {
      expect(validateQuota(200).quota).to.equal(100);
    });

    it('should reject quota < 2', () => {
      expect(validateQuota(1).valid).to.be.false;
      expect(validateQuota(0).valid).to.be.false;
    });
  });

  describe('escapeMarkdown', () => {
    it('should escape markdown characters', () => {
      expect(escapeMarkdown('*bold*')).to.equal('\\*bold\\*');
      expect(escapeMarkdown('_italic_')).to.equal('\\_italic\\_');
      expect(escapeMarkdown('`code`')).to.equal('\\`code\\`');
    });

    it('should handle empty/null input', () => {
      expect(escapeMarkdown('')).to.equal('');
      expect(escapeMarkdown(null)).to.equal('');
    });
  });

  describe('truncate', () => {
    it('should not modify short strings', () => {
      expect(truncate('hello', 10)).to.equal('hello');
    });

    it('should truncate long strings', () => {
      const result = truncate('hello world this is a long string', 10);
      expect(result).to.equal('hello w...');
      expect(result).to.have.lengthOf(10);
    });

    it('should handle empty/null input', () => {
      expect(truncate('')).to.equal('');
      expect(truncate(null)).to.equal('');
    });
  });
});