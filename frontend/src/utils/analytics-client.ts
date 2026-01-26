/**
 * Analytics API Client - Methods for fetching admin analytics data
 * 
 * Provides methods to fetch:
 * - Summary statistics (DAU, sessions, page views, etc.)
 * - Time series data for metrics over time
 * - Funnel conversion data
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface SummaryStats {
  totalUsers: number;
  totalSessions: number;
  totalPageViews: number;
  avgSessionDuration: number;
  bounceRate: number;
  // Computed fields for display
  pageViews: number;
  uniqueVisitors: number;
  newUsers: number;
  returningUsers: number;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface FunnelStep {
  step: string;
  count: number;
  conversionRate: number;
}

export interface FunnelData {
  steps: FunnelStep[];
  overallConversionRate: number;
}

export type DateRange = '7d' | '30d' | '90d' | 'all';

export interface LocationStats {
  countries: Array<{
    country: string;
    sessions: number;
    users: number;
  }>;
  cities: Array<{
    city: string;
    region?: string;
    country: string;
    sessions: number;
    users: number;
  }>;
  timezones: Array<{
    timezone: string;
    count: number;
  }>;
}
export interface Session {
  sessionId: string;
  startTime: string;
  lastActivity?: string;
  duration: number;
  pageViews: number;
  location: string;
  deviceType: string;
  browser?: string;
  os?: string;
  userId?: string;
  hasArticleView?: boolean;
  hasDonation?: boolean;
  hasChat?: boolean;
}

export interface SessionsResponse {
  sessions: Session[];
  total: number;
  limit: number;
  offset: number;
}

export interface SessionEvent {
  _id: string;
  eventType: string;
  eventName?: string;
  category?: string;
  url: string;
  referrer?: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface SessionDetails {
  sessionId: string;
  session: {
    startTime: string;
    lastActivity?: string;
    duration?: number;
    pageViews: number;
    deviceType: string;
    browser?: string;
    os?: string;
    location: string;
    userId?: string;
  };
  events: SessionEvent[];
  totalEvents: number;
}

export type Metric = 'page_views' | 'sessions' | 'users' | 'donations';

/**
 * Get admin key from localStorage
 */
function getAdminKey(): string | null {
  return localStorage.getItem('admin_key');
}

/**
 * Build headers with admin authentication
 */
function buildHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  const adminKey = getAdminKey();
  if (adminKey) {
    headers['X-Admin-Key'] = adminKey;
  }

  return headers;
}

/**
 * Fetch summary statistics
 * @param range - Date range for the summary (7d, 30d, 90d, all)
 */
export async function getSummary(range: DateRange = '7d'): Promise<SummaryStats> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/summary?range=${range}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include', // Include cookies for session-based auth
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    throw new Error(`Failed to fetch summary: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Map backend response to frontend interface
  return {
    totalUsers: data.totalUsers || 0,
    totalSessions: data.totalSessions || 0,
    totalPageViews: data.totalPageViews || 0,
    avgSessionDuration: data.avgSessionDuration || 0,
    bounceRate: data.bounceRate || 0,
    // Computed/display fields
    pageViews: data.totalPageViews || 0,
    uniqueVisitors: data.totalUsers || 0,
    newUsers: Math.round((data.totalUsers || 0) * 0.7), // Estimate: 70% new
    returningUsers: Math.round((data.totalUsers || 0) * 0.3), // Estimate: 30% returning
  };
}

/**
 * Fetch time series data for a specific metric
 * @param metric - The metric to fetch (page_views, sessions, users, donations)
 * @param range - Date range for the data
 */
export async function getTimeseries(
  metric: Metric,
  range: DateRange = '7d'
): Promise<TimeSeriesDataPoint[]> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/timeseries?metric=${metric}&range=${range}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    throw new Error(`Failed to fetch timeseries: ${response.statusText}`);
  }

  const data = await response.json();
  return data.data || [];
}

/**
 * Fetch funnel conversion data
 * @param range - Date range for the funnel data
 */
export async function getFunnels(range: DateRange = '7d'): Promise<FunnelData> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/funnels?range=${range}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    throw new Error(`Failed to fetch funnels: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Calculate overall conversion rate from first to last step
  const steps = data.funnel || [];
  const overallConversionRate = steps.length > 0 && steps[0].count > 0
    ? (steps[steps.length - 1].count / steps[0].count) * 100
    : 0;
  
  return {
    steps: steps,
    overallConversionRate,
  };
}

/**
 * Fetch location statistics
 * @param range - Date range for the location data
 */
export async function getLocations(range: DateRange = '7d'): Promise<LocationStats> {
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/locations?range=${range}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    throw new Error(`Failed to fetch locations: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    countries: data.countries || [],
    cities: data.cities || [],
    timezones: data.timezones || [],
  };
}

/**
 * Fetch list of sessions with pagination and optional filtering
 * @param limit - Number of sessions to fetch (default 20, max 100)
 * @param offset - Number of sessions to skip (default 0)
 * @param bustCache - If true, adds timestamp to prevent browser caching (default false)
 * @param filters - Optional filters for sessions
 */
export async function getSessions(
  limit: number = 20,
  offset: number = 0,
  bustCache: boolean = false,
  filters?: {
    sessionIds?: string[];
    location?: string;
    eventType?: string;
  }
): Promise<SessionsResponse> {
  // Build query parameters
  const params = new URLSearchParams();
  params.append('limit', limit.toString());
  params.append('offset', offset.toString());
  
  // Add filters if provided
  if (filters?.sessionIds && filters.sessionIds.length > 0) {
    params.append('sessionIds', filters.sessionIds.join(','));
  }
  if (filters?.location) {
    params.append('location', filters.location);
  }
  if (filters?.eventType) {
    params.append('eventType', filters.eventType);
  }
  
  // Add cache-busting timestamp when explicitly refreshing
  if (bustCache) {
    params.append('_t', Date.now().toString());
  }
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/sessions?${params.toString()}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
      // Disable cache when explicitly refreshing
      cache: bustCache ? 'no-cache' : 'default',
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    throw new Error(`Failed to fetch sessions: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Fetch detailed events for a specific session
 * @param sessionId - The session ID to fetch events for
 * @param bustCache - If true, adds timestamp to prevent browser caching (default false)
 */
export async function getSessionEvents(sessionId: string, bustCache: boolean = false): Promise<SessionDetails> {
  // Add cache-busting timestamp when explicitly refreshing
  const cacheBuster = bustCache ? `?_t=${Date.now()}` : '';
  
  const response = await fetch(
    `${API_BASE_URL}/api/v1/analytics/sessions/${sessionId}/events${cacheBuster}`,
    {
      method: 'GET',
      headers: buildHeaders(),
      credentials: 'include',
      // Disable cache when explicitly refreshing
      cache: bustCache ? 'no-cache' : 'default',
    }
  );

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('Unauthorized: Admin access required');
    }
    if (response.status === 404) {
      throw new Error('Session not found');
    }
    throw new Error(`Failed to fetch session events: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Save admin key to localStorage
 */
export function saveAdminKey(key: string): void {
  localStorage.setItem('admin_key', key);
}

/**
 * Remove admin key from localStorage
 */
export function clearAdminKey(): void {
  localStorage.removeItem('admin_key');
}

/**
 * Check if admin key is set
 */
export function hasAdminKey(): boolean {
  return !!getAdminKey();
}