import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Activity, 
  Database, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  RefreshCw,
  Download,
  Search,
  BarChart3
} from 'lucide-react';

interface EnrichmentStats {
  totalEnriched: number;
  totalIrsRecords: number;
  enrichmentCoverage: number;
  averageEnrichmentTime: number;
  cacheHitRate: number;
  lastUpdated: string;
  sourceBreakdown: {
    irsBmf: number;
    propublica: number;
    charityNavigator: number;
  };
  qualityMetrics: {
    complete: number;
    partial: number;
    minimal: number;
  };
}

interface CircuitBreakerStatus {
  propublica: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailure: string | null;
    nextAttempt: string | null;
  };
  charityNavigator: {
    state: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
    failures: number;
    lastFailure: string | null;
    nextAttempt: string | null;
  };
}

interface DataQualityReport {
  totalOrganizations: number;
  withNTEE: number;
  withLocation: number;
  withFinancials: number;
  withRatings: number;
  staleData: number;
  erroredEnrichments: number;
  qualityScore: number;
  recommendations: string[];
}

export default function AdminEnrichment() {
  const [stats, setStats] = useState<EnrichmentStats | null>(null);
  const [circuitBreakers, setCircuitBreakers] = useState<CircuitBreakerStatus | null>(null);
  const [qualityReport, setQualityReport] = useState<DataQualityReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchEin, setSearchEin] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [importing, setImporting] = useState(false);
  const [enriching, setEnriching] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const ADMIN_KEY = import.meta.env.VITE_ADMIN_KEY || 'dev-admin-key-12345';

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch statistics
      const statsRes = await fetch(`${API_BASE}/api/v1/enrichment/stats`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      if (!statsRes.ok) throw new Error('Failed to fetch statistics');
      const statsData = await statsRes.json();
      setStats(statsData);

      // Fetch circuit breaker status
      const cbRes = await fetch(`${API_BASE}/api/v1/enrichment/circuit-breaker/status`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      if (!cbRes.ok) throw new Error('Failed to fetch circuit breaker status');
      const cbData = await cbRes.json();
      setCircuitBreakers(cbData);

      // Fetch quality report
      const qrRes = await fetch(`${API_BASE}/api/v1/enrichment/quality-report`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });
      if (!qrRes.ok) throw new Error('Failed to fetch quality report');
      const qrData = await qrRes.json();
      setQualityReport(qrData);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleResetCircuitBreaker = async (service: 'propublica' | 'charityNavigator') => {
    try {
      const res = await fetch(`${API_BASE}/api/v1/enrichment/circuit-breaker/reset`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-key': ADMIN_KEY
        },
        body: JSON.stringify({ service })
      });

      if (!res.ok) throw new Error('Failed to reset circuit breaker');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset circuit breaker');
    }
  };

  const handleSearchEin = async () => {
    try {
      setSearchResult(null);
      const res = await fetch(`${API_BASE}/api/v1/enrichment/ein/${searchEin}`, {
        headers: { 'x-admin-key': ADMIN_KEY }
      });

      if (!res.ok) {
        if (res.status === 404) {
          setSearchResult({ notFound: true });
          return;
        }
        throw new Error('Failed to search');
      }

      const data = await res.json();
      setSearchResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search');
    }
  };

  const handleImportIrs = async () => {
    try {
      setImporting(true);
      setError(null);
      
      const res = await fetch(`${API_BASE}/api/v1/enrichment/irs-bmf/import`, {
        method: 'POST',
        headers: { 'x-admin-key': ADMIN_KEY }
      });

      if (!res.ok) throw new Error('Failed to start IRS import');
      
      alert('IRS BMF import started. This will take 30-60 minutes. Check server logs for progress.');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start import');
    } finally {
      setImporting(false);
    }
  };

  const handleBulkEnrich = async () => {
    try {
      setEnriching(true);
      setError(null);
      
      const res = await fetch(`${API_BASE}/api/v1/enrichment/bulk-enrich`, {
        method: 'POST',
        headers: { 'x-admin-key': ADMIN_KEY }
      });

      if (!res.ok) throw new Error('Failed to start bulk enrichment');
      
      alert('Bulk enrichment started. Check server logs for progress.');
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start enrichment');
    } finally {
      setEnriching(false);
    }
  };

  const getCircuitBreakerBadge = (state: string) => {
    switch (state) {
      case 'CLOSED':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Healthy</Badge>;
      case 'OPEN':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
      case 'HALF_OPEN':
        return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Testing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  if (loading && !stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Enrichment Dashboard</h1>
          <p className="text-gray-500 mt-1">Monitor and manage nonprofit data enrichment</p>
        </div>
        <Button onClick={fetchData} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Enriched</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalEnriched.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.enrichmentCoverage.toFixed(1)}% coverage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">IRS Records</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalIrsRecords.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">Local database</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.cacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Avg: {stats?.averageEnrichmentTime.toFixed(0)}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{qualityReport?.qualityScore.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Data completeness</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="circuit-breakers">Circuit Breakers</TabsTrigger>
          <TabsTrigger value="quality">Data Quality</TabsTrigger>
          <TabsTrigger value="search">Search</TabsTrigger>
          <TabsTrigger value="admin">Admin Tools</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Source Breakdown</CardTitle>
                <CardDescription>Organizations enriched by data source</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">IRS BMF (Local)</span>
                  <Badge variant="outline">{stats?.sourceBreakdown.irsBmf.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">ProPublica API</span>
                  <Badge variant="outline">{stats?.sourceBreakdown.propublica.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Charity Navigator</span>
                  <Badge variant="outline">{stats?.sourceBreakdown.charityNavigator.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quality Metrics</CardTitle>
                <CardDescription>Data completeness distribution</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Complete (All fields)</span>
                  <Badge className="bg-green-500">{stats?.qualityMetrics.complete.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Partial (Some fields)</span>
                  <Badge className="bg-yellow-500">{stats?.qualityMetrics.partial.toLocaleString()}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Minimal (Basic only)</span>
                  <Badge variant="secondary">{stats?.qualityMetrics.minimal.toLocaleString()}</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Circuit Breakers Tab */}
        <TabsContent value="circuit-breakers" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>ProPublica API</CardTitle>
                <CardDescription>Circuit breaker status and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {circuitBreakers && getCircuitBreakerBadge(circuitBreakers.propublica.state)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consecutive Failures</span>
                  <span className="text-sm font-mono">{circuitBreakers?.propublica.failures || 0}</span>
                </div>
                {circuitBreakers?.propublica.lastFailure && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Failure</span>
                    <span className="text-xs text-gray-500">
                      {new Date(circuitBreakers.propublica.lastFailure).toLocaleString()}
                    </span>
                  </div>
                )}
                {circuitBreakers?.propublica.state === 'OPEN' && (
                  <Button 
                    onClick={() => handleResetCircuitBreaker('propublica')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Circuit Breaker
                  </Button>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Charity Navigator API</CardTitle>
                <CardDescription>Circuit breaker status and health</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  {circuitBreakers && getCircuitBreakerBadge(circuitBreakers.charityNavigator.state)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Consecutive Failures</span>
                  <span className="text-sm font-mono">{circuitBreakers?.charityNavigator.failures || 0}</span>
                </div>
                {circuitBreakers?.charityNavigator.lastFailure && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Last Failure</span>
                    <span className="text-xs text-gray-500">
                      {new Date(circuitBreakers.charityNavigator.lastFailure).toLocaleString()}
                    </span>
                  </div>
                )}
                {circuitBreakers?.charityNavigator.state === 'OPEN' && (
                  <Button 
                    onClick={() => handleResetCircuitBreaker('charityNavigator')}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Circuit Breaker
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Data Quality Tab */}
        <TabsContent value="quality" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Data Quality Report</CardTitle>
              <CardDescription>Comprehensive analysis of enriched data quality</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">With NTEE Codes</p>
                  <p className="text-2xl font-bold">{qualityReport?.withNTEE.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">With Location</p>
                  <p className="text-2xl font-bold">{qualityReport?.withLocation.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">With Financials</p>
                  <p className="text-2xl font-bold">{qualityReport?.withFinancials.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">With Ratings</p>
                  <p className="text-2xl font-bold">{qualityReport?.withRatings.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Stale Data</p>
                  <p className="text-2xl font-bold text-yellow-600">{qualityReport?.staleData.toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">Errors</p>
                  <p className="text-2xl font-bold text-red-600">{qualityReport?.erroredEnrichments.toLocaleString()}</p>
                </div>
              </div>

              {qualityReport?.recommendations && qualityReport.recommendations.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-2">Recommendations</h4>
                  <ul className="space-y-2">
                    {qualityReport.recommendations.map((rec, idx) => (
                      <li key={idx} className="text-sm text-gray-600 flex items-start">
                        <AlertCircle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Search by EIN</CardTitle>
              <CardDescription>Look up enriched organization data by EIN</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Label htmlFor="ein">EIN (Tax ID)</Label>
                  <Input
                    id="ein"
                    placeholder="12-3456789 or 123456789"
                    value={searchEin}
                    onChange={(e) => setSearchEin(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearchEin()}
                  />
                </div>
                <Button onClick={handleSearchEin} className="mt-auto">
                  <Search className="w-4 h-4 mr-2" />
                  Search
                </Button>
              </div>

              {searchResult && (
                <div className="mt-4 p-4 border rounded-lg">
                  {searchResult.notFound ? (
                    <p className="text-sm text-gray-500">No enriched data found for this EIN</p>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium">{searchResult.name}</p>
                        <p className="text-xs text-gray-500">{searchResult.slug}</p>
                      </div>
                      {searchResult.classification?.nteeCode && (
                        <div>
                          <p className="text-xs text-gray-500">NTEE Code</p>
                          <Badge variant="outline">{searchResult.classification.nteeCode}</Badge>
                        </div>
                      )}
                      {searchResult.location && (
                        <div>
                          <p className="text-xs text-gray-500">Location</p>
                          <p className="text-sm">
                            {searchResult.location.city}, {searchResult.location.state}
                          </p>
                        </div>
                      )}
                      <div className="flex gap-2 text-xs text-gray-500">
                        <span>Last Updated: {new Date(searchResult.lastEnriched).toLocaleDateString()}</span>
                        {searchResult.isStale && <Badge variant="secondary">Stale</Badge>}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Admin Tools Tab */}
        <TabsContent value="admin" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Import IRS BMF Data</CardTitle>
                <CardDescription>Download and import 1.8M IRS records (30-60 min)</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleImportIrs}
                  disabled={importing}
                  className="w-full"
                >
                  {importing ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Start IRS Import
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This will download the latest IRS BMF data and import it into MongoDB.
                  Check server logs for progress.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Bulk Enrichment</CardTitle>
                <CardDescription>Enrich all organizations with EINs</CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  onClick={handleBulkEnrich}
                  disabled={enriching}
                  className="w-full"
                  variant="secondary"
                >
                  {enriching ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Activity className="w-4 h-4 mr-2" />
                      Start Bulk Enrichment
                    </>
                  )}
                </Button>
                <p className="text-xs text-gray-500 mt-2">
                  This will enrich all organizations that have EINs but haven't been enriched yet.
                  Check server logs for progress.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}