/**
 * React hook for analytics tracking
 * 
 * Provides easy access to the analytics tracker instance
 * and common tracking methods for React components.
 */

import { useCallback } from 'react';
import analyticsTracker from '@/utils/analytics-tracker';

interface TrackOptions {
  eventName?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export function useAnalytics() {
  /**
   * Track a custom event
   */
  const track = useCallback((eventType: string, options?: TrackOptions) => {
    analyticsTracker.track(eventType, options);
  }, []);

  /**
   * Track a page view
   */
  const trackPageView = useCallback((pageName?: string) => {
    analyticsTracker.track('page_view', {
      eventName: pageName || document.title,
      category: 'navigation',
      metadata: {
        path: window.location.pathname,
        search: window.location.search,
      },
    });
  }, []);

  /**
   * Track a button click
   */
  const trackClick = useCallback((buttonName: string, metadata?: Record<string, any>) => {
    analyticsTracker.track('button_click', {
      eventName: buttonName,
      category: 'interaction',
      metadata,
    });
  }, []);

  /**
   * Track a form submission
   */
  const trackFormSubmit = useCallback((formName: string, metadata?: Record<string, any>) => {
    analyticsTracker.track('form_submit', {
      eventName: formName,
      category: 'conversion',
      metadata,
    });
  }, []);

  /**
   * Track an error
   */
  const trackError = useCallback((errorMessage: string, metadata?: Record<string, any>) => {
    analyticsTracker.track('error', {
      eventName: errorMessage,
      category: 'error',
      metadata,
    });
  }, []);

  return {
    track,
    trackPageView,
    trackClick,
    trackFormSubmit,
    trackError,
    tracker: analyticsTracker,
  };
}

export default useAnalytics;