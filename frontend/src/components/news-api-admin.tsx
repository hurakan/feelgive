import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, Plus, Settings, TrendingUp, AlertCircle, CheckCircle, XCircle, Loader2, FileText, Clock, BarChart3, ExternalLink, Calendar, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NewsAPIConfig {
  _id: string;
  name: string;
  provider: string;
  isEnabled: boolean;
  priority: number;
  rateLimit: {
    requestsPerDay: number;
    requestsPerHour?: number;
    currentDayUsage: number;
    currentHourUsage: number;
  };
  keywords: string[];
  countries: string[];
  totalArticlesFetched: number;
  lastFetchedAt?: string;
  lastSuccessfulFetch?: string;
  lastError?: string;
}

interface UsageStats {
  provider: string;
  name: string;
  isEnabled: boolean;
  dailyLimit: number;
  dailyUsage: number;
  dailyRemaining: number;
  hourlyLimit?: number;
  hourlyUsage?: number;
  hourlyRemaining?: number;
  totalArticlesFetched: number;
  lastFetchedAt?: string;
  lastSuccessfulFetch?: string;
  lastError?: string;
}

interface FetchProgress {
  currentSource: string;
  sourcesProcessed: number;
  totalSources: number;
  articlesFound: number;
  errors: string[];
  startTime: number;
}

interface FetchReport {
  totalArticles: number;
  sourceBreakdown: { provider: string; count: number; success: boolean; error?: string }[];
  duration: number;
  timestamp: Date;
}

interface ArticleReport {
  _id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  apiSource: string;
  publishedAt: string;
  fetchedAt: string;
  classificationStatus: string;
}

interface ArticlesReportData {
  articles: ArticleReport[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';

export function NewsAPIAdmin() {
  const [configs, setConfigs] = useState<NewsAPIConfig[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);
  const [showReportDialog, setShowReportDialog] = useState(false);
  const [fetchProgress, setFetchProgress] = useState<FetchProgress | null>(null);
  const [fetchReport, setFetchReport] = useState<FetchReport | null>(null);
  const [articlesReport, setArticlesReport] = useState<ArticlesReportData | null>(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    apiSource: 'all',
    status: 'all',
    page: 1,
    limit: 50,
  });
  const [newConfig, setNewConfig] = useState({
    name: '',
    apiKey: '',
    provider: '',
    requestsPerDay: 100,
    requestsPerHour: 0,
    keywords: '',
    countries: '',
  });

  useEffect(() => {
    loadConfigs();
    loadUsageStats();
  }, []);

  useEffect(() => {
    loadArticlesReport();
  }, [reportFilters]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/news/configs`);
      if (!response.ok) throw new Error('Failed to load configurations');
      const data = await response.json();
      setConfigs(data);
    } catch (error: any) {
      toast.error('Failed to load configurations: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/usage`);
      if (!response.ok) throw new Error('Failed to load usage stats');
      const data = await response.json();
      setUsageStats(data);
    } catch (error: any) {
      console.error('Failed to load usage stats:', error);
    }
  };

  const handleToggle = async (provider: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/configs/${provider}/toggle`, {
        method: 'PATCH',
      });
      if (!response.ok) throw new Error('Failed to toggle configuration');
      
      await loadConfigs();
      await loadUsageStats();
      toast.success('Configuration updated');
    } catch (error: any) {
      toast.error('Failed to toggle: ' + error.message);
    }
  };

  const handleAddConfig = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/news/configs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newConfig,
          keywords: newConfig.keywords.split(',').map(k => k.trim()).filter(Boolean),
          countries: newConfig.countries.split(',').map(c => c.trim()).filter(Boolean),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to add configuration');
      }

      await loadConfigs();
      await loadUsageStats();
      setShowAddDialog(false);
      setNewConfig({
        name: '',
        apiKey: '',
        provider: '',
        requestsPerDay: 100,
        requestsPerHour: 0,
        keywords: '',
        countries: '',
      });
      toast.success('Configuration added successfully');
    } catch (error: any) {
      toast.error('Failed to add configuration: ' + error.message);
    }
  };

  const handleFetchNews = async () => {
    const enabledSources = usageStats.filter(s => s.isEnabled);
    
    if (enabledSources.length === 0) {
      toast.error('No enabled news sources. Please enable at least one source.');
      return;
    }

    setIsFetching(true);
    setShowProgressDialog(true);
    
    const startTime = Date.now();
    const sourceBreakdown: { provider: string; count: number; success: boolean; error?: string }[] = [];
    
    // Initialize progress
    setFetchProgress({
      currentSource: enabledSources[0].name,
      sourcesProcessed: 0,
      totalSources: enabledSources.length,
      articlesFound: 0,
      errors: [],
      startTime,
    });

    try {
      // Simulate progress updates (since we can't get real-time updates from the backend)
      const progressInterval = setInterval(() => {
        setFetchProgress(prev => {
          if (!prev) return null;
          const elapsed = Date.now() - prev.startTime;
          const estimatedProgress = Math.min(
            Math.floor((elapsed / 60000) * prev.totalSources), // Estimate based on 60s per source
            prev.totalSources - 1
          );
          
          return {
            ...prev,
            sourcesProcessed: estimatedProgress,
            currentSource: enabledSources[Math.min(estimatedProgress, enabledSources.length - 1)]?.name || 'Finalizing...',
          };
        });
      }, 2000);

      const response = await fetch(`${API_BASE_URL}/news/fetch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      });

      clearInterval(progressInterval);

      if (!response.ok) throw new Error('Failed to fetch news');
      
      const data = await response.json();
      
      // Build source breakdown from response
      enabledSources.forEach(source => {
        const articlesFromSource = data.articles?.filter((a: any) => a.apiSource === source.provider).length || 0;
        sourceBreakdown.push({
          provider: source.name,
          count: articlesFromSource,
          success: true,
        });
      });

      // Update final progress
      setFetchProgress({
        currentSource: 'Complete',
        sourcesProcessed: enabledSources.length,
        totalSources: enabledSources.length,
        articlesFound: data.count || 0,
        errors: [],
        startTime,
      });

      // Create report
      const duration = Date.now() - startTime;
      setFetchReport({
        totalArticles: data.count || 0,
        sourceBreakdown,
        duration,
        timestamp: new Date(),
      });

      await loadUsageStats();
      
      // Show report after a brief delay
      setTimeout(() => {
        setShowProgressDialog(false);
        setShowReportDialog(true);
      }, 1000);

    } catch (error: any) {
      toast.error('Failed to fetch news: ' + error.message);
      setShowProgressDialog(false);
    } finally {
      setIsFetching(false);
    }
  };

  const getUsagePercentage = (usage: number, limit: number): number => {
    return Math.min((usage / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const loadArticlesReport = async () => {
    setIsLoadingReport(true);
    try {
      const params = new URLSearchParams({
        limit: reportFilters.limit.toString(),
        page: reportFilters.page.toString(),
      });
      
      if (reportFilters.apiSource !== 'all') {
        params.append('apiSource', reportFilters.apiSource);
      }
      if (reportFilters.status !== 'all') {
        params.append('status', reportFilters.status);
      }

      const response = await fetch(`${API_BASE_URL}/news/articles?${params}`);
      if (!response.ok) throw new Error('Failed to load articles report');
      
      const data = await response.json();
      setArticlesReport(data);
    } catch (error: any) {
      toast.error('Failed to load articles report: ' + error.message);
    } finally {
      setIsLoadingReport(false);
    }
  };

  const groupArticlesBySourceAndDate = (articles: ArticleReport[]) => {
    const grouped: Record<string, Record<string, ArticleReport[]>> = {};
    
    articles.forEach(article => {
      const source = article.apiSource;
      const date = new Date(article.publishedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!grouped[source]) {
        grouped[source] = {};
      }
      if (!grouped[source][date]) {
        grouped[source][date] = [];
      }
      grouped[source][date].push(article);
    });
    
    return grouped;
  };

  const getSourceDisplayName = (apiSource: string): string => {
    const sourceNames: Record<string, string> = {
      newsapi: 'NewsAPI.org',
      newsdata: 'NewsData.io',
      currents: 'Currents API',
      guardian: 'Guardian',
      mediastack: 'MediaStack',
      gnews: 'GNews.io',
    };
    return sourceNames[apiSource] || apiSource;
  };

  const getStatusBadgeVariant = (status: string): "default" | "secondary" | "destructive" => {
    switch (status) {
      case 'classified':
        return 'default';
      case 'pending':
        return 'secondary';
      case 'irrelevant':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <div className="space-y-6 pb-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">News API Management</h2>
          <p className="text-sm text-muted-foreground">
            Manage news sources and monitor API usage
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              loadConfigs();
              loadUsageStats();
            }}
            disabled={isLoading}
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isLoading && 'animate-spin')} />
            Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleFetchNews}
            disabled={isFetching}
          >
            <TrendingUp className={cn('h-4 w-4 mr-2', isFetching && 'animate-pulse')} />
            Fetch News Now
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Source
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add News API Source</DialogTitle>
                <DialogDescription>
                  Configure a new news API source for crisis monitoring
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., NewsAPI Primary"
                      value={newConfig.name}
                      onChange={(e) => setNewConfig({ ...newConfig, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="provider">Provider</Label>
                    <Select
                      value={newConfig.provider}
                      onValueChange={(value) => setNewConfig({ ...newConfig, provider: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="newsapi">NewsAPI.org</SelectItem>
                        <SelectItem value="newsdata">NewsData.io</SelectItem>
                        <SelectItem value="currents">Currents API</SelectItem>
                        <SelectItem value="guardian">Guardian Open Platform</SelectItem>
                        <SelectItem value="mediastack">MediaStack</SelectItem>
                        <SelectItem value="gnews">GNews.io</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Enter API key"
                    value={newConfig.apiKey}
                    onChange={(e) => setNewConfig({ ...newConfig, apiKey: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dailyLimit">Daily Request Limit</Label>
                    <Input
                      id="dailyLimit"
                      type="number"
                      value={newConfig.requestsPerDay}
                      onChange={(e) => setNewConfig({ ...newConfig, requestsPerDay: parseInt(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="hourlyLimit">Hourly Limit (optional)</Label>
                    <Input
                      id="hourlyLimit"
                      type="number"
                      value={newConfig.requestsPerHour}
                      onChange={(e) => setNewConfig({ ...newConfig, requestsPerHour: parseInt(e.target.value) })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="keywords">Keywords (comma-separated)</Label>
                  <Textarea
                    id="keywords"
                    placeholder="earthquake, flood, refugee, disaster..."
                    value={newConfig.keywords}
                    onChange={(e) => setNewConfig({ ...newConfig, keywords: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="countries">Countries (comma-separated, optional)</Label>
                  <Input
                    id="countries"
                    placeholder="us, gb, ca..."
                    value={newConfig.countries}
                    onChange={(e) => setNewConfig({ ...newConfig, countries: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddConfig}>Add Source</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="usage" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
          <TabsTrigger value="configs">Configurations</TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Articles Report
          </TabsTrigger>
        </TabsList>

        <TabsContent value="usage" className="space-y-4">
          {usageStats.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No news sources configured yet
              </CardContent>
            </Card>
          ) : (
            usageStats.map((stat) => {
              const dailyPercentage = getUsagePercentage(stat.dailyUsage, stat.dailyLimit);
              const hourlyPercentage = stat.hourlyLimit
                ? getUsagePercentage(stat.hourlyUsage || 0, stat.hourlyLimit)
                : 0;

              return (
                <Card key={stat.provider}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {stat.name}
                          {stat.isEnabled ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="h-3 w-3 mr-1" />
                              Disabled
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Provider: {stat.provider} • Total fetched: {stat.totalArticlesFetched}
                        </CardDescription>
                      </div>
                      {stat.lastError && (
                        <Badge variant="destructive" className="flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Error
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Daily Usage */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Daily Usage</span>
                        <span className="text-muted-foreground">
                          {stat.dailyUsage} / {stat.dailyLimit} ({dailyPercentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={dailyPercentage} className={getUsageColor(dailyPercentage)} />
                      <p className="text-xs text-muted-foreground">
                        {stat.dailyRemaining} requests remaining today
                      </p>
                    </div>

                    {/* Hourly Usage */}
                    {stat.hourlyLimit && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">Hourly Usage</span>
                          <span className="text-muted-foreground">
                            {stat.hourlyUsage} / {stat.hourlyLimit} ({hourlyPercentage.toFixed(0)}%)
                          </span>
                        </div>
                        <Progress value={hourlyPercentage} className={getUsageColor(hourlyPercentage)} />
                        <p className="text-xs text-muted-foreground">
                          {stat.hourlyRemaining} requests remaining this hour
                        </p>
                      </div>
                    )}

                    {/* Last Fetch Info */}
                    <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                      <span>
                        Last fetch: {stat.lastFetchedAt ? new Date(stat.lastFetchedAt).toLocaleString() : 'Never'}
                      </span>
                      {stat.lastSuccessfulFetch && (
                        <span>
                          Last success: {new Date(stat.lastSuccessfulFetch).toLocaleString()}
                        </span>
                      )}
                    </div>

                    {/* Error Message */}
                    {stat.lastError && (
                      <div className="bg-destructive/10 text-destructive text-xs p-3 rounded space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="font-medium mb-1">Last Error:</div>
                            <div className="break-words">{stat.lastError}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          Note: Errors will automatically clear on next successful fetch. If this is a server-side error (500), the API provider is experiencing issues.
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="configs" className="space-y-4">
          {configs.length === 0 ? (
            <Card>
              <CardContent className="pt-6 text-center text-muted-foreground">
                No news sources configured yet. Click "Add Source" to get started.
              </CardContent>
            </Card>
          ) : (
            configs.map((config) => (
              <Card key={config._id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{config.name}</CardTitle>
                      <CardDescription>
                        Provider: {config.provider} • Priority: {config.priority}
                      </CardDescription>
                    </div>
                    <Switch
                      checked={config.isEnabled}
                      onCheckedChange={() => handleToggle(config.provider)}
                    />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Daily Limit:</span> {config.rateLimit.requestsPerDay}
                    </div>
                    {config.rateLimit.requestsPerHour && (
                      <div>
                        <span className="font-medium">Hourly Limit:</span> {config.rateLimit.requestsPerHour}
                      </div>
                    )}
                  </div>
                  {config.keywords.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Keywords:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {config.keywords.map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {config.countries.length > 0 && (
                    <div>
                      <span className="text-sm font-medium">Countries:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {config.countries.map((country, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {country.toUpperCase()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Source</Label>
                  <Select
                    value={reportFilters.apiSource}
                    onValueChange={(value) => setReportFilters({ ...reportFilters, apiSource: value, page: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="newsapi">NewsAPI.org</SelectItem>
                      <SelectItem value="newsdata">NewsData.io</SelectItem>
                      <SelectItem value="currents">Currents API</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="mediastack">MediaStack</SelectItem>
                      <SelectItem value="gnews">GNews.io</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={reportFilters.status}
                    onValueChange={(value) => setReportFilters({ ...reportFilters, status: value, page: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="classified">Classified</SelectItem>
                      <SelectItem value="irrelevant">Irrelevant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Items per page</Label>
                  <Select
                    value={reportFilters.limit.toString()}
                    onValueChange={(value) => setReportFilters({ ...reportFilters, limit: parseInt(value), page: 1 })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="25">25</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                      <SelectItem value="100">100</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          {articlesReport && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-primary">
                    {articlesReport.pagination.total}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Articles</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-500">
                    {articlesReport.pagination.pages}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Pages</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-green-500">
                    {articlesReport.articles.filter(a => a.classificationStatus === 'classified').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Classified</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-yellow-500">
                    {articlesReport.articles.filter(a => a.classificationStatus === 'pending').length}
                  </div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Articles Report */}
          {isLoadingReport ? (
            <Card>
              <CardContent className="pt-6 flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </CardContent>
            </Card>
          ) : articlesReport && articlesReport.articles.length > 0 ? (
            <>
              {Object.entries(groupArticlesBySourceAndDate(articlesReport.articles)).map(([source, dateGroups]) => (
                <Card key={source}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      {getSourceDisplayName(source)}
                      <Badge variant="secondary" className="ml-auto">
                        {Object.values(dateGroups).flat().length} articles
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {Object.entries(dateGroups)
                      .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
                      .map(([date, articles]) => (
                        <div key={date} className="space-y-3">
                          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground border-b pb-2">
                            <Calendar className="h-4 w-4" />
                            {date}
                            <Badge variant="outline" className="ml-2">
                              {articles.length} articles
                            </Badge>
                          </div>
                          <div className="space-y-2">
                            {articles.map((article) => (
                              <div
                                key={article._id}
                                className="group p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 space-y-2">
                                    <div className="flex items-start gap-2">
                                      <a
                                        href={article.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-medium text-sm hover:text-primary transition-colors flex items-center gap-2 group/link"
                                      >
                                        <span className="line-clamp-2">{article.title}</span>
                                        <ExternalLink className="h-3 w-3 opacity-0 group-hover/link:opacity-100 transition-opacity flex-shrink-0" />
                                      </a>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {article.description}
                                    </p>
                                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {article.source}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {new Date(article.publishedAt).toLocaleTimeString('en-US', {
                                          hour: '2-digit',
                                          minute: '2-digit',
                                        })}
                                      </span>
                                    </div>
                                  </div>
                                  <Badge variant={getStatusBadgeVariant(article.classificationStatus)}>
                                    {article.classificationStatus}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </CardContent>
                </Card>
              ))}

              {/* Pagination */}
              {articlesReport.pagination.pages > 1 && (
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {articlesReport.pagination.page} of {articlesReport.pagination.pages}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReportFilters({ ...reportFilters, page: reportFilters.page - 1 })}
                          disabled={reportFilters.page === 1}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setReportFilters({ ...reportFilters, page: reportFilters.page + 1 })}
                          disabled={reportFilters.page === articlesReport.pagination.pages}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  No articles found matching the selected filters
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => setReportFilters({ apiSource: 'all', status: 'all', page: 1, limit: 50 })}
                >
                  Reset Filters
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Progress Dialog */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              Fetching News Articles
            </DialogTitle>
            <DialogDescription>
              Please wait while we fetch news from enabled sources...
            </DialogDescription>
          </DialogHeader>
          
          {fetchProgress && (
            <div className="space-y-6 py-4">
              {/* Overall Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span>Overall Progress</span>
                  <span className="text-muted-foreground">
                    {fetchProgress.sourcesProcessed} / {fetchProgress.totalSources} sources
                  </span>
                </div>
                <Progress 
                  value={(fetchProgress.sourcesProcessed / fetchProgress.totalSources) * 100} 
                  className="h-2"
                />
              </div>

              {/* Current Source */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Current Source:</span>
                  <Badge variant="secondary" className="animate-pulse">
                    {fetchProgress.currentSource}
                  </Badge>
                </div>
              </div>

              {/* Articles Counter */}
              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="font-medium">Articles Found</span>
                </div>
                <span className="text-2xl font-bold text-primary">
                  {fetchProgress.articlesFound}
                </span>
              </div>

              {/* Elapsed Time */}
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>Elapsed Time</span>
                </div>
                <span className="font-mono">
                  {Math.floor((Date.now() - fetchProgress.startTime) / 1000)}s
                </span>
              </div>

              {/* Errors */}
              {fetchProgress.errors.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                    <AlertCircle className="h-4 w-4" />
                    <span>Errors Encountered</span>
                  </div>
                  <div className="space-y-1">
                    {fetchProgress.errors.map((error, idx) => (
                      <div key={idx} className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={showReportDialog} onOpenChange={setShowReportDialog}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Fetch Complete
            </DialogTitle>
            <DialogDescription>
              News articles have been successfully fetched and stored
            </DialogDescription>
          </DialogHeader>
          
          {fetchReport && (
            <div className="space-y-6 py-4">
              {/* Summary Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {fetchReport.totalArticles}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Total Articles
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-blue-500">
                      {fetchReport.sourceBreakdown.filter(s => s.success).length}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Sources Used
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6 text-center">
                    <div className="text-3xl font-bold text-purple-500">
                      {(fetchReport.duration / 1000).toFixed(1)}s
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Duration
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Source Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm">Source Breakdown</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {fetchReport.sourceBreakdown.map((source, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {source.success ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium text-sm">{source.provider}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        {source.error ? (
                          <Badge variant="destructive" className="text-xs">
                            Error
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">
                            {source.count} articles
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xs text-muted-foreground text-center pt-4 border-t">
                Completed at {fetchReport.timestamp.toLocaleString()}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setShowReportDialog(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}