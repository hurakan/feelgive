/**
 * Analytics Tracker - Client-side event tracking with buffering and batching
 * 
 * Features:
 * - Event buffering with periodic flushing (every 5 seconds)
 * - Session management (anon_user_id and session_id)
 * - Retry logic for failed requests
 * - Automatic flush on page unload
 */

interface AnalyticsEvent {
  eventType: string;
  eventName?: string;
  category?: string;
  metadata?: Record<string, any>;
  url: string;
  referrer?: string;
  timestamp: string;
  sessionId: string;
  userId?: string;
}

interface DeviceInfo {
  deviceType: string;
  browser: string;
  os: string;
  screenWidth: number;
  screenHeight: number;
  country?: string;
  city?: string;
  region?: string;
  timezone?: string;
  latitude?: number;
  longitude?: number;
}

interface IngestPayload {
  events: AnalyticsEvent[];
  deviceInfo?: DeviceInfo;
}

class AnalyticsTracker {
  private static instance: AnalyticsTracker;
  private eventBuffer: AnalyticsEvent[] = [];
  private sessionId: string;
  private anonUserId: string;
  private flushInterval: number = 5000; // 5 seconds
  private maxBufferSize: number = 10;
  private flushTimer: NodeJS.Timeout | null = null;
  private apiEndpoint: string;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;
  private deviceInfo: DeviceInfo;
  private isInitialized: boolean = false;
  private locationDataPromise: Promise<void> | null = null;

  private constructor() {
    // Get API endpoint from environment or use default
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    this.apiEndpoint = `${baseUrl}/api/v1/analytics/ingest`;

    // Initialize session and user IDs
    this.sessionId = this.getOrCreateSessionId();
    this.anonUserId = this.getOrCreateAnonUserId();

    // Collect device information
    this.deviceInfo = this.collectDeviceInfo();

    // Fetch location data asynchronously
    this.locationDataPromise = this.fetchLocationData();

    // Setup event listeners
    this.setupEventListeners();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): AnalyticsTracker {
    if (!AnalyticsTracker.instance) {
      AnalyticsTracker.instance = new AnalyticsTracker();
    }
    return AnalyticsTracker.instance;
  }

  /**
   * Initialize the tracker and start periodic flushing
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;
    this.startPeriodicFlush();
    
    // Track app initialization
    this.track('app_open', {
      category: 'lifecycle',
      metadata: {
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      },
    });

    console.log('[Analytics] Tracker initialized', {
      sessionId: this.sessionId,
      anonUserId: this.anonUserId,
    });
  }

  /**
   * Track an analytics event
   */
  public track(
    eventType: string,
    options: {
      eventName?: string;
      category?: string;
      metadata?: Record<string, any>;
    } = {}
  ): void {
    const event: AnalyticsEvent = {
      eventType,
      eventName: options.eventName,
      category: options.category,
      metadata: options.metadata,
      url: window.location.href,
      referrer: document.referrer || undefined,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.anonUserId,
    };

    this.eventBuffer.push(event);

    // Flush immediately if buffer is full
    if (this.eventBuffer.length >= this.maxBufferSize) {
      this.flush();
    }
  }

  /**
   * Flush buffered events to the server
   */
  public async flush(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      return;
    }

    // Wait for location data if it's still loading
    if (this.locationDataPromise) {
      await this.locationDataPromise;
    }

    const eventsToSend = [...this.eventBuffer];
    this.eventBuffer = [];

    const payload: IngestPayload = {
      events: eventsToSend,
      deviceInfo: this.deviceInfo,
    };

    await this.sendWithRetry(payload);
  }

  /**
   * Send payload with retry logic
   */
  private async sendWithRetry(
    payload: IngestPayload,
    attempt: number = 1
  ): Promise<void> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      console.log(`[Analytics] Sent ${payload.events.length} events`);
    } catch (error) {
      console.error(`[Analytics] Failed to send events (attempt ${attempt}):`, error);

      // Retry if we haven't exceeded max attempts
      if (attempt < this.retryAttempts) {
        const delay = this.retryDelay * attempt;
        console.log(`[Analytics] Retrying in ${delay}ms...`);
        
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.sendWithRetry(payload, attempt + 1);
      } else {
        console.error('[Analytics] Max retry attempts reached, events lost');
      }
    }
  }

  /**
   * Get or create session ID
   */
  private getOrCreateSessionId(): string {
    const SESSION_KEY = 'analytics_session_id';
    const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

    const stored = sessionStorage.getItem(SESSION_KEY);
    const lastActivity = localStorage.getItem('analytics_last_activity');

    // Check if session is still valid
    if (stored && lastActivity) {
      const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
      if (timeSinceLastActivity < SESSION_TIMEOUT) {
        // Update last activity
        localStorage.setItem('analytics_last_activity', Date.now().toString());
        return stored;
      }
    }

    // Create new session
    const newSessionId = this.generateUUID();
    sessionStorage.setItem(SESSION_KEY, newSessionId);
    localStorage.setItem('analytics_last_activity', Date.now().toString());
    return newSessionId;
  }

  /**
   * Get or create anonymous user ID
   */
  private getOrCreateAnonUserId(): string {
    const USER_KEY = 'analytics_anon_user_id';
    
    const stored = localStorage.getItem(USER_KEY);
    if (stored) {
      return stored;
    }

    const newUserId = this.generateUUID();
    localStorage.setItem(USER_KEY, newUserId);
    return newUserId;
  }

  /**
   * Generate UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Fetch location data from IP geolocation service
   */
  private async fetchLocationData(): Promise<void> {
    try {
      // Use ipapi.co for free IP geolocation
      const response = await fetch('https://ipapi.co/json/');
      if (response.ok) {
        const data = await response.json();
        // Update device info with location data
        this.deviceInfo = {
          ...this.deviceInfo,
          country: data.country_name,
          city: data.city,
          region: data.region,
          latitude: data.latitude,
          longitude: data.longitude,
        };
      }
    } catch (error) {
      console.warn('[Analytics] Failed to fetch location data:', error);
    }
  }

  /**
   * Collect device information
   */
  private collectDeviceInfo(): DeviceInfo {
    const ua = navigator.userAgent;
    
    // Detect device type
    let deviceType = 'desktop';
    if (/mobile/i.test(ua)) {
      deviceType = 'mobile';
    } else if (/tablet|ipad/i.test(ua)) {
      deviceType = 'tablet';
    }

    // Detect browser
    let browser = 'unknown';
    if (ua.includes('Chrome')) browser = 'Chrome';
    else if (ua.includes('Safari')) browser = 'Safari';
    else if (ua.includes('Firefox')) browser = 'Firefox';
    else if (ua.includes('Edge')) browser = 'Edge';

    // Detect OS
    let os = 'unknown';
    if (ua.includes('Windows')) os = 'Windows';
    else if (ua.includes('Mac')) os = 'macOS';
    else if (ua.includes('Linux')) os = 'Linux';
    else if (ua.includes('Android')) os = 'Android';
    else if (ua.includes('iOS')) os = 'iOS';

    return {
      deviceType,
      browser,
      os,
      screenWidth: window.screen.width,
      screenHeight: window.screen.height,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners(): void {
    // Flush on page unload
    window.addEventListener('beforeunload', () => {
      this.flush();
    });

    // Flush on visibility change (tab switch, minimize)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.flush();
      }
    });

    // Update last activity on user interaction
    const updateActivity = () => {
      localStorage.setItem('analytics_last_activity', Date.now().toString());
    };

    window.addEventListener('click', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('scroll', updateActivity);
  }

  /**
   * Start periodic flushing
   */
  private startPeriodicFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushInterval);
  }

  /**
   * Stop periodic flushing
   */
  public destroy(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    this.flush();
    this.isInitialized = false;
  }
}

// Export singleton instance
export const analyticsTracker = AnalyticsTracker.getInstance();
export default analyticsTracker;