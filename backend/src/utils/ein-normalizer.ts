/**
 * EIN Normalization Utility
 * Handles different EIN formats and validates them
 * 
 * Common formats:
 * - 12-3456789 (with hyphen)
 * - 123456789 (without hyphen)
 * - 12 3456789 (with space)
 */

export class EINNormalizer {
  /**
   * Normalize EIN to standard 9-digit format
   * Removes hyphens, spaces, and other non-numeric characters
   */
  static normalize(ein: string | undefined | null): string | null {
    if (!ein) {
      return null;
    }

    // Remove all non-numeric characters
    const cleaned = ein.replace(/\D/g, '');

    // Validate length
    if (cleaned.length !== 9) {
      return null;
    }

    return cleaned;
  }

  /**
   * Validate EIN format
   * Returns true if EIN is valid (9 digits)
   */
  static isValid(ein: string | undefined | null): boolean {
    if (!ein) {
      return false;
    }

    const normalized = this.normalize(ein);
    return normalized !== null && /^\d{9}$/.test(normalized);
  }

  /**
   * Format EIN with hyphen (12-3456789)
   * For display purposes
   */
  static format(ein: string | undefined | null): string | null {
    const normalized = this.normalize(ein);
    
    if (!normalized) {
      return null;
    }

    return `${normalized.substring(0, 2)}-${normalized.substring(2)}`;
  }

  /**
   * Compare two EINs for equality
   * Handles different formats
   */
  static equals(ein1: string | undefined | null, ein2: string | undefined | null): boolean {
    const normalized1 = this.normalize(ein1);
    const normalized2 = this.normalize(ein2);

    if (!normalized1 || !normalized2) {
      return false;
    }

    return normalized1 === normalized2;
  }

  /**
   * Batch normalize multiple EINs
   * Returns array of normalized EINs, filtering out invalid ones
   */
  static normalizeMany(eins: (string | undefined | null)[]): string[] {
    return eins
      .map(ein => this.normalize(ein))
      .filter((ein): ein is string => ein !== null);
  }

  /**
   * Extract EIN from text
   * Finds patterns like "EIN: 12-3456789" or "Tax ID: 123456789"
   */
  static extractFromText(text: string): string | null {
    if (!text) {
      return null;
    }

    // Pattern: optional "EIN" or "Tax ID" followed by 9 digits with optional hyphen
    const patterns = [
      /(?:EIN|Tax\s+ID|Federal\s+ID)[\s:]*(\d{2}[-\s]?\d{7})/i,
      /\b(\d{2}[-\s]?\d{7})\b/,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        const normalized = this.normalize(match[1]);
        if (normalized) {
          return normalized;
        }
      }
    }

    return null;
  }
}

// Export convenience functions
export const normalizeEIN = EINNormalizer.normalize;
export const isValidEIN = EINNormalizer.isValid;
export const formatEIN = EINNormalizer.format;
export const compareEINs = EINNormalizer.equals;