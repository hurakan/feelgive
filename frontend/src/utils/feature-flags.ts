/**
 * Feature Flags Utility
 * 
 * Manages feature flags stored in localStorage for development/testing purposes.
 * These flags are revealed via secret keyboard shortcuts in the Settings Modal.
 */

const FEATURE_FLAGS_KEY = 'feelgive_feature_flags';

export interface FeatureFlags {
  enableEveryOrgPayment: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  enableEveryOrgPayment: false, // Default to OFF - integration not production-ready
};

/**
 * Get all feature flags from localStorage
 */
export function getFeatureFlags(): FeatureFlags {
  const stored = localStorage.getItem(FEATURE_FLAGS_KEY);
  if (!stored) {
    return { ...DEFAULT_FLAGS };
  }
  
  try {
    const parsed = JSON.parse(stored);
    // Merge with defaults to ensure all flags exist
    return { ...DEFAULT_FLAGS, ...parsed };
  } catch {
    return { ...DEFAULT_FLAGS };
  }
}

/**
 * Save feature flags to localStorage
 */
export function saveFeatureFlags(flags: FeatureFlags): void {
  localStorage.setItem(FEATURE_FLAGS_KEY, JSON.stringify(flags));
}

/**
 * Update a single feature flag
 */
export function updateFeatureFlag(key: keyof FeatureFlags, value: boolean): void {
  const flags = getFeatureFlags();
  flags[key] = value;
  saveFeatureFlags(flags);
}

/**
 * Check if Every.org payment integration is enabled
 */
export function isEveryOrgPaymentEnabled(): boolean {
  const flags = getFeatureFlags();
  return flags.enableEveryOrgPayment;
}

/**
 * Reset all feature flags to defaults
 */
export function resetFeatureFlags(): void {
  saveFeatureFlags({ ...DEFAULT_FLAGS });
}