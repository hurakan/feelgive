import { Charity } from '@/types';
import { isEveryOrgPaymentEnabled } from './feature-flags';

/**
 * Every.org Integration Utilities
 *
 * This module handles the integration with Every.org's donation platform.
 * It provides URL generation, validation, and feature flag checking.
 */

export interface EveryOrgDonationParams {
  slug: string;
  amount: number;
  frequency?: 'once' | 'monthly';
  email?: string;
}

export interface EveryOrgValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}

/**
 * Check if Every.org payments are enabled via feature flag
 * This checks the localStorage feature flag set in Settings (Ctrl+Shift+F)
 */
export function isEveryOrgEnabled(): boolean {
  return isEveryOrgPaymentEnabled();
}

/**
 * Validate a charity for Every.org donation
 */
export function validateCharityForEveryOrg(charity: Charity): EveryOrgValidationResult {
  // Check if charity has a slug
  if (!charity.slug) {
    return {
      isValid: false,
      error: 'This charity does not have an Every.org identifier configured.',
    };
  }

  // Check if charity is active
  if (!charity.isActive) {
    return {
      isValid: false,
      error: 'This charity is currently not accepting donations.',
    };
  }

  // Warn if slug hasn't been verified
  if (!charity.everyOrgVerified) {
    return {
      isValid: true,
      warning: 'This charity link has not been fully verified. Please report any issues.',
    };
  }

  return { isValid: true };
}

/**
 * Validate donation amount for Every.org
 */
export function validateDonationAmount(amount: number): EveryOrgValidationResult {
  if (isNaN(amount) || amount <= 0) {
    return {
      isValid: false,
      error: 'Please enter a valid donation amount.',
    };
  }

  if (amount < 1) {
    return {
      isValid: false,
      error: 'Minimum donation amount is $1.',
    };
  }

  if (amount > 10000) {
    return {
      isValid: false,
      error: 'Maximum donation amount is $10,000 per transaction.',
    };
  }

  return { isValid: true };
}

/**
 * Generate Every.org donation URL
 *
 * @param params - Donation parameters
 * @returns The complete Every.org donation URL
 *
 * @example
 * ```ts
 * const url = generateEveryOrgUrl({
 *   slug: 'red-cross',
 *   amount: 25,
 *   frequency: 'monthly'
 * });
 * // Returns: https://www.every.org/red-cross?amount=2&frequency=MONTHLY&redirect=http://localhost:5173/donation-success#/donate/paypal/confirm
 * ```
 */
export function generateEveryOrgUrl(params: EveryOrgDonationParams): string {
  const { slug, amount, frequency = 'once', email } = params;

  // Get base URL and redirect URL from environment
  const donationBaseUrl = import.meta.env.VITE_DONATION_BASE_URL || 'www.every.org';
  const redirectUrl = import.meta.env.VITE_REDIRECT_URL || 'http://localhost:5137/donation-success';

  // Build base URL with slug
  const baseUrl = `https://${donationBaseUrl}/${slug}`;
  
  // Build query parameters
  const queryParams = new URLSearchParams();
  queryParams.set('amount', amount.toString());
  queryParams.set('frequency', frequency === 'monthly' ? 'MONTHLY' : 'ONCE');
  queryParams.set('success_url', redirectUrl);
  
  // Add email if provided
  if (email) {
    queryParams.set('email', email);
  }

  // Build final URL with hash fragment and query parameters
  // Format: https://www.every.org/slug#donate?params
  return `${baseUrl}#donate?${queryParams.toString()}`;
}

/**
 * Redirect to Every.org donation page in the same window
 *
 * @param params - Donation parameters
 */
export function openEveryOrgDonation(params: EveryOrgDonationParams): void {
  const url = generateEveryOrgUrl(params);
  
  // Redirect in same window to allow Every.org to redirect back to success page
  window.location.href = url;
}

/**
 * Get a user-friendly error message for Every.org integration issues
 */
export function getEveryOrgErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unable to process donation. Please try again or contact support.';
}