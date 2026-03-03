import { describe, it, expect } from '@jest/globals';
import { EINNormalizer, normalizeEIN, isValidEIN, formatEIN, compareEINs } from '../ein-normalizer';

describe('EIN Normalizer', () => {
  describe('normalize', () => {
    it('should remove hyphens from EIN', () => {
      expect(EINNormalizer.normalize('12-3456789')).toBe('123456789');
      expect(EINNormalizer.normalize('53-0196605')).toBe('530196605');
    });

    it('should handle EIN without hyphens', () => {
      expect(EINNormalizer.normalize('123456789')).toBe('123456789');
      expect(EINNormalizer.normalize('530196605')).toBe('530196605');
    });

    it('should remove all non-digit characters', () => {
      expect(EINNormalizer.normalize('12-345-6789')).toBe('123456789');
      expect(EINNormalizer.normalize('12.3456789')).toBe('123456789');
      expect(EINNormalizer.normalize('12 3456789')).toBe('123456789');
    });

    it('should return null for empty string', () => {
      expect(EINNormalizer.normalize('')).toBeNull();
    });

    it('should return null for strings with only non-digits', () => {
      expect(EINNormalizer.normalize('ABC-DEF-GHI')).toBeNull();
      expect(EINNormalizer.normalize('---')).toBeNull();
    });

    it('should preserve leading zeros', () => {
      expect(EINNormalizer.normalize('01-2345678')).toBe('012345678');
      expect(EINNormalizer.normalize('00-1234567')).toBe('001234567');
    });

    it('should return null for wrong length', () => {
      expect(EINNormalizer.normalize('12345678')).toBeNull(); // 8 digits
      expect(EINNormalizer.normalize('1234567890')).toBeNull(); // 10 digits
    });

    it('should handle null and undefined', () => {
      expect(EINNormalizer.normalize(null)).toBeNull();
      expect(EINNormalizer.normalize(undefined)).toBeNull();
    });
  });

  describe('isValid', () => {
    it('should validate correct 9-digit EINs', () => {
      expect(EINNormalizer.isValid('123456789')).toBe(true);
      expect(EINNormalizer.isValid('530196605')).toBe(true);
    });

    it('should validate EINs with hyphens', () => {
      expect(EINNormalizer.isValid('12-3456789')).toBe(true);
      expect(EINNormalizer.isValid('53-0196605')).toBe(true);
    });

    it('should reject EINs with wrong length', () => {
      expect(EINNormalizer.isValid('12345678')).toBe(false); // 8 digits
      expect(EINNormalizer.isValid('1234567890')).toBe(false); // 10 digits
    });

    it('should reject empty EINs', () => {
      expect(EINNormalizer.isValid('')).toBe(false);
    });

    it('should reject EINs with no digits', () => {
      expect(EINNormalizer.isValid('ABC-DEF-GHI')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(EINNormalizer.isValid(null)).toBe(false);
      expect(EINNormalizer.isValid(undefined)).toBe(false);
    });

    it('should validate real-world EINs', () => {
      // American Red Cross
      expect(EINNormalizer.isValid('53-0196605')).toBe(true);
      // Salvation Army
      expect(EINNormalizer.isValid('13-5562351')).toBe(true);
      // United Way
      expect(EINNormalizer.isValid('13-1635294')).toBe(true);
    });
  });

  describe('format', () => {
    it('should format EIN with hyphen', () => {
      expect(EINNormalizer.format('123456789')).toBe('12-3456789');
      expect(EINNormalizer.format('530196605')).toBe('53-0196605');
    });

    it('should format already hyphenated EIN', () => {
      expect(EINNormalizer.format('12-3456789')).toBe('12-3456789');
    });

    it('should return null for invalid EIN', () => {
      expect(EINNormalizer.format('12345678')).toBeNull();
      expect(EINNormalizer.format('')).toBeNull();
      expect(EINNormalizer.format(null)).toBeNull();
    });
  });

  describe('equals', () => {
    it('should compare EINs correctly', () => {
      expect(EINNormalizer.equals('12-3456789', '123456789')).toBe(true);
      expect(EINNormalizer.equals('123456789', '12-3456789')).toBe(true);
      expect(EINNormalizer.equals('12-3456789', '12-3456789')).toBe(true);
    });

    it('should return false for different EINs', () => {
      expect(EINNormalizer.equals('12-3456789', '98-7654321')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(EINNormalizer.equals(null, '123456789')).toBe(false);
      expect(EINNormalizer.equals('123456789', null)).toBe(false);
      expect(EINNormalizer.equals(null, null)).toBe(false);
    });
  });

  describe('normalizeMany', () => {
    it('should normalize multiple EINs', () => {
      const eins = ['12-3456789', '98-7654321', '53-0196605'];
      const result = EINNormalizer.normalizeMany(eins);
      expect(result).toEqual(['123456789', '987654321', '530196605']);
    });

    it('should filter out invalid EINs', () => {
      const eins = ['12-3456789', 'invalid', null, '98-7654321', undefined, ''];
      const result = EINNormalizer.normalizeMany(eins);
      expect(result).toEqual(['123456789', '987654321']);
    });

    it('should handle empty array', () => {
      expect(EINNormalizer.normalizeMany([])).toEqual([]);
    });
  });

  describe('extractFromText', () => {
    it('should extract EIN from text with label', () => {
      expect(EINNormalizer.extractFromText('EIN: 12-3456789')).toBe('123456789');
      expect(EINNormalizer.extractFromText('Tax ID: 53-0196605')).toBe('530196605');
      expect(EINNormalizer.extractFromText('Federal ID: 98-7654321')).toBe('987654321');
    });

    it('should extract EIN without label', () => {
      expect(EINNormalizer.extractFromText('The organization 12-3456789 is registered')).toBe('123456789');
    });

    it('should return null if no EIN found', () => {
      expect(EINNormalizer.extractFromText('No EIN here')).toBeNull();
      expect(EINNormalizer.extractFromText('')).toBeNull();
    });

    it('should handle complex text', () => {
      const text = 'American Red Cross (EIN: 53-0196605) is a humanitarian organization.';
      expect(EINNormalizer.extractFromText(text)).toBe('530196605');
    });
  });

  describe('Convenience Functions', () => {
    it('normalizeEIN should work', () => {
      expect(normalizeEIN('12-3456789')).toBe('123456789');
    });

    it('isValidEIN should work', () => {
      expect(isValidEIN('12-3456789')).toBe(true);
      expect(isValidEIN('invalid')).toBe(false);
    });

    it('formatEIN should work', () => {
      expect(formatEIN('123456789')).toBe('12-3456789');
    });

    it('compareEINs should work', () => {
      expect(compareEINs('12-3456789', '123456789')).toBe(true);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle very long strings', () => {
      const longString = '1'.repeat(1000);
      expect(EINNormalizer.normalize(longString)).toBeNull();
    });

    it('should handle special characters', () => {
      expect(EINNormalizer.normalize('12-3456789!@#$%')).toBe('123456789');
      expect(EINNormalizer.normalize('12<script>alert(1)</script>3456789')).toBe('123456789');
    });

    it('should handle unicode characters', () => {
      expect(EINNormalizer.normalize('12-3456789™')).toBe('123456789');
      expect(EINNormalizer.normalize('①②-③④⑤⑥⑦⑧⑨')).toBeNull();
    });

    it('should be consistent with multiple calls', () => {
      const ein = '12-3456789';
      const result1 = EINNormalizer.normalize(ein);
      const result2 = EINNormalizer.normalize(ein);
      const result3 = EINNormalizer.normalize(ein);
      
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
    });
  });

  describe('Performance', () => {
    it('should normalize 1000 EINs quickly', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        EINNormalizer.normalize('12-3456789');
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(100); // Should take less than 100ms
    });

    it('should validate 1000 EINs quickly', () => {
      const start = Date.now();
      
      for (let i = 0; i < 1000; i++) {
        EINNormalizer.isValid('12-3456789');
      }
      
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(200); // Should take less than 200ms
    });
  });
});