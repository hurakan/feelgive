import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Activity, Users, Eye, TrendingUp, ArrowLeft, Lock, BarChart3, MousePointerClick, Clock, Newspaper, MessageCircle, Heart, ChevronDown, ChevronRight, Zap, X, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useAnalytics } from '@/hooks/use-analytics';
import {
  getSummary,
  getTimeseries,
  getFunnels,
  getLocations,
  getSessions,
  getSessionEvents,
  saveAdminKey,
  hasAdminKey,
  clearAdminKey,
  type DateRange,
  type SummaryStats,
  type TimeSeriesDataPoint,
  type FunnelData,
  type LocationStats,
  type Session,
  type SessionDetails,
} from '@/utils/analytics-client';

export default function AdminAnalytics() {
  const navigate = useNavigate();
  const analytics = useAnalytics();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isAuthenticated, setIsAuthenticated] = useState(hasAdminKey());
  const [adminKey, setAdminKey] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isGeneratingTestData, setIsGeneratingTestData] = useState(false);
  
  const [dateRange, setDateRange] = useState<DateRange>('7d');
  const [summary, setSummary] = useState<SummaryStats | null>(null);
  const [pageViewsData, setPageViewsData] = useState<TimeSeriesDataPoint[]>([]);
  const [sessionsData, setSessionsData] = useState<TimeSeriesDataPoint[]>([]);
  const [funnelData, setFunnelData] = useState<FunnelData | null>(null);
  const [locationData, setLocationData] = useState<LocationStats | null>(null);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionDetails | null>(null);
  const [sessionsTotal, setSessionsTotal] = useState(0);
  const [sessionsPage, setSessionsPage] = useState(0);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [expandedSessionDetails, setExpandedSessionDetails] = useState<SessionDetails | null>(null);
  const [isLoadingExpanded, setIsLoadingExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  
  // Session filtering state
  const [sessionFilters, setSessionFilters] = useState<{
    sessionIds?: string[];
    location?: string;
    eventType?: string;
  }>({});
  const [activeTab, setActiveTab] = useState('trends');

  // Load data when authenticated or date range changes
  useEffect(() => {
    if (isAuthenticated) {
      loadAnalyticsData();
    }
  }, [isAuthenticated, dateRange]);

  const handleAuthenticate = async () => {
    if (!adminKey.trim()) {
      toast.error('Please enter an admin key');
      return;
    }

    setIsAuthenticating(true);
    saveAdminKey(adminKey);

    try {
      // Test the key by fetching summary
      await getSummary('7d');
      setIsAuthenticated(true);
      toast.success('Authentication successful');
    } catch (error) {
      clearAdminKey();
      setIsAuthenticated(false);
      toast.error('Invalid admin key');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    clearAdminKey();
    setIsAuthenticated(false);
    setAdminKey('');
    toast.info('Logged out');
  };

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [summaryData, pageViews, sessions, funnels, locations] = await Promise.all([
        getSummary(dateRange),
        getTimeseries('page_views', dateRange),
        getTimeseries('sessions', dateRange),
        getFunnels(dateRange),
        getLocations(dateRange),
      ]);

      setSummary(summaryData);
      setPageViewsData(pageViews);
      setSessionsData(sessions);
      setFunnelData(funnels);
      setLocationData(locations);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics data';
      setError(errorMessage);
      toast.error(errorMessage);
      
      // If unauthorized, clear auth
      if (errorMessage.includes('Unauthorized')) {
        clearAdminKey();
        setIsAuthenticated(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to navigate to sessions tab with filters
  const navigateToSessionsWithFilter = (filters: {
    sessionIds?: string[];
    location?: string;
    eventType?: string;
  }) => {
    setSessionFilters(filters);
    setActiveTab('sessions');
    // Update URL params
    const params = new URLSearchParams(searchParams);
    params.set('tab', 'sessions');
    if (filters.sessionIds) {
      params.set('sessionIds', filters.sessionIds.join(','));
    }
    if (filters.location) {
      params.set('location', filters.location);
    }
    if (filters.eventType) {
      params.set('eventType', filters.eventType);
    }
    setSearchParams(params);
    // Load sessions with filters
    loadSessions(0, true, filters);
  };

  // Helper function to clear filters
  const clearSessionFilters = () => {
    setSessionFilters({});
    const params = new URLSearchParams(searchParams);
    params.delete('sessionIds');
    params.delete('location');
    params.delete('eventType');
    setSearchParams(params);
    loadSessions(0, true);
  };

  const loadSessions = async (page: number = 0, bustCache: boolean = false, filters?: {
    sessionIds?: string[];
    location?: string;
    eventType?: string;
  }) => {
    setIsLoadingSessions(true);
    
    // Clear expanded session state when refreshing to prevent stale data
    if (bustCache) {
      setExpandedSessionId(null);
      setExpandedSessionDetails(null);
    }
    
    try {
      const limit = 20;
      const offset = page * limit;
      const activeFilters = filters || sessionFilters;
      const data = await getSessions(limit, offset, bustCache, activeFilters);
      console.log('[AdminAnalytics] Loaded sessions:', {
        total: data.total,
        count: data.sessions.length,
        filters: activeFilters,
        sessions: data.sessions.map(s => ({
          id: s.sessionId,
          start: s.startTime,
          lastActivity: s.lastActivity,
          hasArticle: s.hasArticleView
        }))
      });
      setSessions(data.sessions);
      setSessionsTotal(data.total);
      setSessionsPage(page);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load sessions';
      console.error('[AdminAnalytics] Error loading sessions:', error);
      toast.error(errorMessage);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const loadSessionDetails = async (sessionId: string) => {
    setIsLoadingSessions(true);
    try {
      const data = await getSessionEvents(sessionId);
      setSelectedSession(data);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session details';
      toast.error(errorMessage);
    } finally {
      setIsLoadingSessions(false);
    }
  };

  const toggleSessionExpansion = async (sessionId: string, forceRefresh: boolean = false) => {
    console.log('[SessionExpansion] Toggle called:', { sessionId, forceRefresh, currentlyExpanded: expandedSessionId });
    
    if (expandedSessionId === sessionId && !forceRefresh) {
      // Collapse if already expanded
      console.log('[SessionExpansion] Collapsing session');
      setExpandedSessionId(null);
      setExpandedSessionDetails(null);
      setEventTypeFilter('all'); // Reset filter when collapsing
    } else {
      // Expand and load details (always fetch fresh data)
      console.log('[SessionExpansion] Expanding session, fetching fresh data...');
      setExpandedSessionId(sessionId);
      setEventTypeFilter('all'); // Reset filter when expanding new session
      setIsLoadingExpanded(true);
      try {
        const data = await getSessionEvents(sessionId, true); // Always bust cache
        console.log('[SessionExpansion] Received data from API:', {
          sessionId: data.sessionId,
          totalEvents: data.totalEvents,
          events: data.events.map(e => ({
            type: e.eventType,
            name: e.eventName,
            hasUrl: !!e.metadata?.articleUrl,
            url: e.metadata?.articleUrl,
            timestamp: e.timestamp
          }))
        });
        setExpandedSessionDetails(data);
        console.log('[SessionExpansion] State updated with new data');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load session details';
        console.error('[SessionExpansion] Error loading session:', error);
        toast.error(errorMessage);
        setExpandedSessionId(null);
      } finally {
        setIsLoadingExpanded(false);
      }
    }
  };

  const generateTestData = async () => {
    setIsGeneratingTestData(true);
    try {
      toast.info('Generating test data...');
      
      // Simulate a user journey with delays between events
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      
      // 1. App Open
      analytics.track('app_open', {
        eventName: 'Test User Journey',
        category: 'lifecycle',
        metadata: { source: 'test_data_generator' }
      });
      await delay(500);
      
      // 2. Page View
      analytics.track('page_view', {
        eventName: 'Home Page',
        category: 'navigation',
        metadata: { path: '/', source: 'test_data_generator' }
      });
      await delay(1000);
      
      // 3. Article Opened
      analytics.track('article_opened', {
        eventName: 'Test Article: Climate Crisis Impact',
        category: 'news',
        metadata: {
          articleId: 'test-article-123',
          articleUrl: 'https://example.com/climate-crisis',
          source: 'Test News Source',
          eventTag: 'crisis',
          generator: 'test_data_generator'
        }
      });
      await delay(2000);
      
      // 4. Chat Opened
      analytics.track('chat_opened', {
        eventName: 'AI Assistant',
        category: 'engagement',
        metadata: { source: 'test_data_generator' }
      });
      await delay(1500);
      
      // 5. Donate Clicked
      analytics.track('donate_clicked', {
        eventName: 'Climate Action Fund',
        category: 'conversion',
        metadata: {
          organizationId: 'test-org-456',
          organizationName: 'Climate Action Fund',
          source: 'test_data_generator'
        }
      });
      await delay(1000);
      
      // 6. Donation Success
      analytics.track('donation_success', {
        eventName: 'Donation Completed',
        category: 'conversion',
        metadata: {
          amount: 25,
          organizationId: 'test-org-456',
          organizationName: 'Climate Action Fund',
          source: 'test_data_generator'
        }
      });
      
      toast.success('Test data generated! Refresh the dashboard to see updates.');
      
      // Reload analytics data after a short delay
      setTimeout(() => {
        loadAnalyticsData();
      }, 2000);
      
    } catch (error) {
      console.error('Error generating test data:', error);
      toast.error('Failed to generate test data');
    } finally {
      setIsGeneratingTestData(false);
    }
  };

  // Authentication screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Lock className="h-6 w-6 text-primary" />
              <CardTitle className="text-2xl">Admin Analytics</CardTitle>
            </div>
            <CardDescription>
              Enter your admin key to access the analytics dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-key">Admin Key</Label>
              <Input
                id="admin-key"
                type="password"
                placeholder="Enter admin key"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAuthenticate();
                  }
                }}
                disabled={isAuthenticating}
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate('/')}
                className="flex-1"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                onClick={handleAuthenticate}
                disabled={isAuthenticating || !adminKey.trim()}
                className="flex-1"
              >
                {isAuthenticating ? 'Authenticating...' : 'Access Dashboard'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Dashboard screen
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <div className="flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <h1 className="text-2xl font-bold">User Behavior Dashboard</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {import.meta.env.DEV && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateTestData}
                  disabled={isGeneratingTestData}
                  className="gap-2"
                >
                  <Zap className="h-4 w-4" />
                  {isGeneratingTestData ? 'Generating...' : 'Generate Test Data'}
                </Button>
              )}
              <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Last 7 days</SelectItem>
                  <SelectItem value="30d">Last 30 days</SelectItem>
                  <SelectItem value="90d">Last 90 days</SelectItem>
                  <SelectItem value="all">All time</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {error && (
          <Card className="mb-6 border-destructive">
            <CardContent className="pt-6">
              <p className="text-destructive">{error}</p>
              <Button onClick={loadAnalyticsData} className="mt-4">
                Retry
              </Button>
            </CardContent>
          </Card>
        )}

        {isLoading && !summary ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Activity className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading analytics data...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPI Tiles */}
            {summary && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalUsers.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {summary.newUsers} new, {summary.returningUsers} returning
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                    <Activity className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.totalSessions.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg duration: {Math.round(summary.avgSessionDuration / 60)}m
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Page Views</CardTitle>
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.pageViews.toLocaleString()}</div>
                    <p className="text-xs text-muted-foreground">
                      {summary.uniqueVisitors.toLocaleString()} unique visitors
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Bounce Rate</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{summary.bounceRate.toFixed(1)}%</div>
                    <p className="text-xs text-muted-foreground">
                      Single page sessions
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Charts */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                  <TabsTrigger value="journey">User Journey</TabsTrigger>
                  <TabsTrigger value="locations">Locations</TabsTrigger>
                  <TabsTrigger value="sessions" onClick={() => !sessions.length && loadSessions()}>
                    Session Explorer
                    {(sessionFilters.sessionIds || sessionFilters.location || sessionFilters.eventType) && (
                      <Badge variant="secondary" className="ml-2">
                        <Filter className="h-3 w-3" />
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
                
                {/* Filter indicator and clear button */}
                {(sessionFilters.sessionIds || sessionFilters.location || sessionFilters.eventType) && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-2">
                      <Filter className="h-3 w-3" />
                      {sessionFilters.sessionIds && `${sessionFilters.sessionIds.length} sessions`}
                      {sessionFilters.location && `Location: ${sessionFilters.location}`}
                      {sessionFilters.eventType && `Event: ${sessionFilters.eventType}`}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSessionFilters}
                      className="h-8"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Clear Filters
                    </Button>
                  </div>
                )}
              </div>

              <TabsContent value="trends" className="space-y-4">
                {/* Activity Over Time */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Over Time</CardTitle>
                    <CardDescription>When users are engaging with the application</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={pageViewsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            // Extract date parts from ISO string to avoid timezone conversion
                            const dateStr = typeof value === 'string' ? value : new Date(value).toISOString();
                            const [year, month, day] = dateStr.split('T')[0].split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            });
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(value) => {
                            // Extract date parts from ISO string to avoid timezone conversion
                            const dateStr = typeof value === 'string' ? value : new Date(value).toISOString();
                            const [year, month, day] = dateStr.split('T')[0].split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--primary))" 
                          strokeWidth={2}
                          name="Page Views"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Sessions Over Time</CardTitle>
                    <CardDescription>User session activity patterns</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={sessionsData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                          dataKey="date"
                          tick={{ fontSize: 12 }}
                          tickFormatter={(value) => {
                            // Extract date parts from ISO string to avoid timezone conversion
                            const dateStr = typeof value === 'string' ? value : new Date(value).toISOString();
                            const [year, month, day] = dateStr.split('T')[0].split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric'
                            });
                          }}
                        />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip
                          labelFormatter={(value) => {
                            // Extract date parts from ISO string to avoid timezone conversion
                            const dateStr = typeof value === 'string' ? value : new Date(value).toISOString();
                            const [year, month, day] = dateStr.split('T')[0].split('-');
                            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                            return date.toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric'
                            });
                          }}
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="hsl(var(--chart-2))" 
                          strokeWidth={2}
                          name="Sessions"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="journey">
                {funnelData && (
                  <Card>
                    <CardHeader>
                      <CardTitle>User Journey</CardTitle>
                      <CardDescription>
                        Click on any step to view sessions with that activity
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <ResponsiveContainer width="100%" height={400}>
                          <BarChart
                            data={funnelData.steps}
                            layout="vertical"
                            onClick={(data) => {
                              if (data && data.activePayload && data.activePayload[0]) {
                                const step = data.activePayload[0].payload;
                                const eventTypeMap: Record<string, string> = {
                                  'App Open': 'app_open',
                                  'Article Open': 'article_opened',
                                  'Used Chat': 'chat_opened',
                                  'Donate Click': 'donate_clicked',
                                  'Donation Success': 'donation_success',
                                };
                                const eventType = eventTypeMap[step.step];
                                if (eventType) {
                                  toast.info(`Filtering ${step.count} sessions with ${step.step}`);
                                  navigateToSessionsWithFilter({ eventType });
                                }
                              }
                            }}
                          >
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" tick={{ fontSize: 12 }} />
                            <YAxis
                              dataKey="step"
                              type="category"
                              width={150}
                              tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                              formatter={(value: number, name: string) => {
                                return [value.toLocaleString(), 'User Actions'];
                              }}
                              content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                  return (
                                    <div className="bg-popover border rounded-lg p-3 shadow-lg">
                                      <p className="font-medium">{payload[0].payload.step}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {payload[0].value} sessions
                                      </p>
                                      <p className="text-xs text-primary mt-1">Click to filter sessions</p>
                                    </div>
                                  );
                                }
                                return null;
                              }}
                            />
                            <Legend />
                            <Bar
                              dataKey="count"
                              fill="hsl(var(--primary))"
                              name="User Actions"
                              cursor="pointer"
                            />
                          </BarChart>
                        </ResponsiveContainer>
                        <p className="text-sm text-muted-foreground text-center">
                          💡 Tip: Click on any bar to view sessions that performed that action
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="locations" className="space-y-4">
                {locationData ? (
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Countries */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Countries</CardTitle>
                        <CardDescription>Click to view sessions from each country</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {locationData.countries.length > 0 ? (
                          <div className="space-y-2">
                            {locationData.countries.map((country, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  toast.info(`Filtering ${country.sessions} sessions from ${country.country}`);
                                  navigateToSessionsWithFilter({ location: country.country });
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer text-left"
                              >
                                <span className="font-medium">{country.country}</span>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-muted-foreground">
                                    {country.users} users, {country.sessions} sessions
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No location data available yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Top Cities */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Top Cities</CardTitle>
                        <CardDescription>Click to view sessions from each city</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {locationData.cities.length > 0 ? (
                          <div className="space-y-2">
                            {locationData.cities.map((city, index) => (
                              <button
                                key={index}
                                onClick={() => {
                                  const locationStr = `${city.city}, ${city.country}`;
                                  toast.info(`Filtering ${city.sessions} sessions from ${locationStr}`);
                                  navigateToSessionsWithFilter({ location: city.city });
                                }}
                                className="w-full flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer text-left"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{city.city}{city.region ? `, ${city.region}` : ''}</span>
                                  <span className="text-xs text-muted-foreground">{city.country}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="text-sm text-muted-foreground">
                                    {city.users} users, {city.sessions} sessions
                                  </div>
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                </div>
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No city data available yet
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Timezones */}
                    <Card className="md:col-span-2">
                      <CardHeader>
                        <CardTitle>User Timezones</CardTitle>
                        <CardDescription>Distribution by timezone</CardDescription>
                      </CardHeader>
                      <CardContent>
                        {locationData.timezones.length > 0 ? (
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {locationData.timezones.map((tz, index) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <span className="text-sm font-medium">{tz.timezone}</span>
                                <span className="text-sm text-muted-foreground">{tz.count}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No timezone data available yet
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No location data available</p>
                )}
              </TabsContent>

              <TabsContent value="sessions" className="space-y-4">
                {(() => {
                  console.log('[AdminAnalytics] Session tab state:', {
                    selectedSession: selectedSession ? 'SET' : 'NULL',
                    selectedSessionId: selectedSession?.sessionId
                  });
                  return null;
                })()}
                {selectedSession ? (
                  // Session Details View
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Session Details</CardTitle>
                          <CardDescription>
                            Session ID: {selectedSession.sessionId}
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(null)}
                        >
                          <ArrowLeft className="h-4 w-4 mr-2" />
                          Back to Sessions
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Session Info */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Device</p>
                          <p className="font-medium">{selectedSession.session.deviceType}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Location</p>
                          <p className="font-medium">{selectedSession.session.location}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Page Views</p>
                          <p className="font-medium">{selectedSession.session.pageViews}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Start Time</p>
                          <p className="font-medium">
                            {new Date(selectedSession.session.startTime).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {/* Events Timeline */}
                      <div>
                        <h3 className="text-lg font-semibold mb-4">Event Timeline ({selectedSession.totalEvents} events)</h3>
                        <div className="space-y-3">
                          {[...selectedSession.events].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((event, index) => (
                            <div key={event._id} className="flex gap-3 p-3 border rounded-lg">
                              <div className="flex-shrink-0 w-32 text-sm text-muted-foreground">
                                {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  {event.eventType === 'page_view' && <Eye className="h-4 w-4" />}
                                  {event.eventType === 'donate_clicked' && <MousePointerClick className="h-4 w-4" />}
                                  {event.eventType === 'app_open' && <Activity className="h-4 w-4" />}
                                  {event.eventType === 'article_opened' && <Eye className="h-4 w-4" />}
                                  <span className="font-medium">{event.eventType}</span>
                                  {event.eventName && event.eventType === 'article_opened' && event.metadata?.articleUrl ? (
                                    <a
                                      href={event.metadata.articleUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-primary hover:underline ml-1"
                                    >
                                      - {event.eventName}
                                    </a>
                                  ) : event.eventName ? (
                                    <span className="text-sm text-muted-foreground ml-1">- {event.eventName}</span>
                                  ) : null}
                                </div>
                                {event.category && (
                                  <p className="text-sm text-muted-foreground">Category: {event.category}</p>
                                )}
                                {event.metadata && Object.keys(event.metadata).length > 0 && (
                                  <details className="mt-2">
                                    <summary className="text-sm text-muted-foreground cursor-pointer">
                                      View metadata
                                    </summary>
                                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-x-auto">
                                      {JSON.stringify(event.metadata, null, 2)}
                                    </pre>
                                  </details>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  // Sessions List View
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle>Session Explorer</CardTitle>
                          <CardDescription>
                            Detailed view of individual user sessions - click to expand and see activity timeline
                          </CardDescription>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => loadSessions(0, true)}
                          disabled={isLoadingSessions}
                        >
                          <Activity className={`h-4 w-4 mr-2 ${isLoadingSessions ? 'animate-spin' : ''}`} />
                          Refresh
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {(() => {
                        console.log('[AdminAnalytics] Rendering sessions list:', {
                          isLoadingSessions,
                          sessionsLength: sessions.length,
                          sessionsTotal,
                          sessions: sessions.slice(0, 3).map(s => ({ id: s.sessionId, location: s.location }))
                        });
                        return null;
                      })()}
                      {isLoadingSessions ? (
                        <div className="flex items-center justify-center py-8">
                          <Activity className="h-6 w-6 animate-spin text-primary" />
                        </div>
                      ) : sessions.length > 0 ? (
                        <>
                          <div className="space-y-2">
                            {sessions.map((session) => {
                              const isExpanded = expandedSessionId === session.sessionId;
                              return (
                                <div key={session.sessionId} className="border rounded-lg overflow-hidden">
                                  <div
                                    className="flex items-center justify-between p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                                    onClick={() => toggleSessionExpansion(session.sessionId)}
                                  >
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-6 gap-4">
                                      <div>
                                        <p className="text-sm text-muted-foreground">Last Activity</p>
                                        <p className="font-medium text-sm">
                                          {new Date(session.lastActivity || session.startTime).toLocaleString()}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Location</p>
                                        <p className="font-medium text-sm">{session.location}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Device</p>
                                        <p className="font-medium text-sm">{session.deviceType}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Page Views</p>
                                        <p className="font-medium text-sm">{session.pageViews}</p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground">Duration</p>
                                        <p className="font-medium text-sm">
                                          {session.duration ? `${Math.round(session.duration / 60)}m` : 'N/A'}
                                        </p>
                                      </div>
                                      <div>
                                        <p className="text-sm text-muted-foreground mb-1">Activities</p>
                                        <div className="flex gap-2">
                                          {session.hasArticleView && (
                                            <div className="group relative">
                                              <Newspaper className="h-4 w-4 text-blue-500" />
                                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Read News
                                              </span>
                                            </div>
                                          )}
                                          {session.hasChat && (
                                            <div className="group relative">
                                              <MessageCircle className="h-4 w-4 text-green-500" />
                                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Used Chat
                                              </span>
                                            </div>
                                          )}
                                          {session.hasDonation && (
                                            <div className="group relative">
                                              <Heart className="h-4 w-4 text-red-500" />
                                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-popover text-popover-foreground rounded shadow-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                                Donated
                                              </span>
                                            </div>
                                          )}
                                          {!session.hasArticleView && !session.hasChat && !session.hasDonation && (
                                            <span className="text-xs text-muted-foreground">None</span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    {isExpanded ? (
                                      <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                                    ) : (
                                      <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0 ml-2" />
                                    )}
                                  </div>

                                  {/* Expanded Session Timeline */}
                                  {isExpanded && (
                                    <div key={`expanded-${session.sessionId}-${expandedSessionDetails?.totalEvents || 0}`} className="border-t bg-muted/20 p-4">
                                      {isLoadingExpanded ? (
                                        <div className="flex items-center justify-center py-4">
                                          <Activity className="h-5 w-5 animate-spin text-primary" />
                                        </div>
                                      ) : expandedSessionDetails ? (
                                        <div className="space-y-4">
                                          <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm">
                                              Session Timeline ({eventTypeFilter === 'all' ? expandedSessionDetails.totalEvents : expandedSessionDetails.events.filter(e => e.eventType === eventTypeFilter).length} events)
                                            </h4>
                                            <div className="flex items-center gap-4">
                                              <div className="flex items-center gap-2">
                                                <Label htmlFor="event-filter" className="text-xs text-muted-foreground">Filter:</Label>
                                                <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                                                  <SelectTrigger id="event-filter" className="h-8 w-[180px] text-xs">
                                                    <SelectValue />
                                                  </SelectTrigger>
                                                  <SelectContent>
                                                    <SelectItem value="all">All Events</SelectItem>
                                                    {Array.from(new Set(expandedSessionDetails.events.map(e => e.eventType))).sort().map(eventType => (
                                                      <SelectItem key={eventType} value={eventType}>
                                                        {eventType} ({expandedSessionDetails.events.filter(e => e.eventType === eventType).length})
                                                      </SelectItem>
                                                    ))}
                                                  </SelectContent>
                                                </Select>
                                              </div>
                                              <div className="flex gap-4 text-xs text-muted-foreground">
                                                <span>Browser: {expandedSessionDetails.session.browser || 'Unknown'}</span>
                                                <span>OS: {expandedSessionDetails.session.os || 'Unknown'}</span>
                                              </div>
                                            </div>
                                          </div>
                                          <div className="space-y-2 max-h-96 overflow-y-auto">
                                            {(() => {
                                              console.log('[Rendering] About to render events:', {
                                                totalEvents: expandedSessionDetails.events.length,
                                                articleEvents: expandedSessionDetails.events.filter(e => e.eventType === 'article_opened').map(e => ({
                                                  name: e.eventName,
                                                  hasUrl: !!e.metadata?.articleUrl,
                                                  url: e.metadata?.articleUrl
                                                }))
                                              });
                                              return null;
                                            })()}
                                            {[...expandedSessionDetails.events]
                                              .filter(event => eventTypeFilter === 'all' || event.eventType === eventTypeFilter)
                                              .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                                              .map((event) => {
                                              if (event.eventType === 'article_opened') {
                                                console.log('[Rendering] Article event:', {
                                                  eventName: event.eventName,
                                                  hasMetadata: !!event.metadata,
                                                  hasArticleUrl: !!event.metadata?.articleUrl,
                                                  articleUrl: event.metadata?.articleUrl,
                                                  willRenderAsLink: !!(event.eventName && event.eventType === 'article_opened' && event.metadata?.articleUrl)
                                                });
                                              }
                                              return (
                                              <div key={event._id} className="flex gap-3 p-3 bg-background border rounded-lg text-sm">
                                                <div className="flex-shrink-0 w-28 text-xs text-muted-foreground">
                                                  {new Date(event.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, {new Date(event.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                </div>
                                                <div className="flex-1">
                                                  <div className="flex items-center gap-2 mb-1">
                                                    {event.eventType === 'page_view' && <Eye className="h-3.5 w-3.5" />}
                                                    {event.eventType === 'donate_clicked' && <MousePointerClick className="h-3.5 w-3.5" />}
                                                    {event.eventType === 'donation_success' && <Heart className="h-3.5 w-3.5 text-red-500" />}
                                                    {event.eventType === 'app_open' && <Activity className="h-3.5 w-3.5" />}
                                                    {event.eventType === 'article_opened' && <Newspaper className="h-3.5 w-3.5 text-blue-500" />}
                                                    {event.eventType === 'chat_opened' && <MessageCircle className="h-3.5 w-3.5 text-green-500" />}
                                                    <span className="font-medium">{event.eventType}</span>
                                                    {event.eventName && event.eventType === 'article_opened' && event.metadata?.articleUrl ? (
                                                      <a
                                                        href={event.metadata.articleUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-primary hover:underline ml-1"
                                                        onClick={(e) => e.stopPropagation()}
                                                      >
                                                        - {event.eventName}
                                                      </a>
                                                    ) : event.eventName ? (
                                                      <span className="text-muted-foreground ml-1">- {event.eventName}</span>
                                                    ) : null}
                                                  </div>
                                                  {event.category && (
                                                    <p className="text-xs text-muted-foreground">Category: {event.category}</p>
                                                  )}
                                                  {event.metadata && Object.keys(event.metadata).length > 0 && (
                                                    <details className="mt-1">
                                                      <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
                                                        View metadata
                                                      </summary>
                                                      <pre className="mt-1 text-xs bg-muted p-2 rounded overflow-x-auto">
                                                        {JSON.stringify(event.metadata, null, 2)}
                                                      </pre>
                                                    </details>
                                                  )}
                                                </div>
                                              </div>
                                            )})}
                                          </div>
                                        </div>
                                      ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">
                                          Failed to load session details
                                        </p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Pagination */}
                          {sessionsTotal > 20 && (
                            <div className="flex items-center justify-between mt-6 pt-4 border-t">
                              <p className="text-sm text-muted-foreground">
                                Showing {sessionsPage * 20 + 1}-{Math.min((sessionsPage + 1) * 20, sessionsTotal)} of {sessionsTotal}
                              </p>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadSessions(sessionsPage - 1)}
                                  disabled={sessionsPage === 0}
                                >
                                  Previous
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => loadSessions(sessionsPage + 1)}
                                  disabled={(sessionsPage + 1) * 20 >= sessionsTotal}
                                >
                                  Next
                                </Button>
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground">No sessions found</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => loadSessions()}
                            className="mt-4"
                          >
                            Refresh
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
          </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}