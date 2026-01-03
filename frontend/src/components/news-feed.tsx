import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ExternalLink, Newspaper, AlertCircle, Settings } from 'lucide-react';
import { NewsArticle, TrackedLocation } from '@/types';
import { getTrackedLocations } from '@/utils/tracked-locations';
import { fetchNewsFromBackend, clearBackendNewsCache, getNewsCacheMetrics } from '@/utils/backend-news-api';
import { getEventTagColor } from '@/utils/news-classifier';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface NewsFeedProps {
  onArticleClick: (url: string, title: string) => void;
  onSettingsClick?: () => void;
}

export function NewsFeed({ onArticleClick, onSettingsClick }: NewsFeedProps) {
  const [locations, setLocations] = useState<TrackedLocation[]>([]);
  const [newsByLocation, setNewsByLocation] = useState<Map<string, NewsArticle[]>>(new Map());
  const [loadingLocations, setLoadingLocations] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async (refresh: boolean = false) => {
    const trackedLocations = getTrackedLocations();
    setLocations(trackedLocations);

    if (trackedLocations.length === 0) {
      return;
    }

    if (refresh) {
      setIsRefreshing(true);
      // Clear existing articles when refreshing
      setNewsByLocation(new Map());
    }

    // Mark all locations as loading
    setLoadingLocations(new Set(trackedLocations.map(loc => loc.id)));

    try {
      // Fetch articles for each location independently and update UI as they arrive
      const fetchPromises = trackedLocations.map(async (location) => {
        try {
          // Fetch from backend news aggregation system with caching
          const articles = await fetchNewsFromBackend(location, 5, refresh);
          
          // Update state immediately when this location's articles arrive
          setNewsByLocation(prev => {
            const updated = new Map(prev);
            updated.set(location.id, articles);
            return updated;
          });
          
          // Remove this location from loading set
          setLoadingLocations(prev => {
            const updated = new Set(prev);
            updated.delete(location.id);
            return updated;
          });
        } catch (error) {
          console.error(`Error loading news for ${location.displayName}:`, error);
          
          // Still remove from loading set even on error
          setLoadingLocations(prev => {
            const updated = new Set(prev);
            updated.delete(location.id);
            return updated;
          });
        }
      });

      // Wait for all to complete
      await Promise.all(fetchPromises);
      
      if (refresh) {
        toast.success('News refreshed with latest articles');
      }
    } catch (error) {
      console.error('Error loading news:', error);
      toast.error('Failed to load news. Showing cached results if available.');
    } finally {
      setIsRefreshing(false);
      setLoadingLocations(new Set());
    }
  };

  const handleRefresh = () => {
    loadNews(true);
  };

  const handleArticleClick = (article: NewsArticle) => {
    onArticleClick(article.url, article.title);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (locations.length === 0) {
    return (
      <Card className="w-full border-2 border-dashed">
        <CardContent className="pt-12 pb-12 text-center">
          <Newspaper className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">No Locations Tracked</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Track locations to see personalized crisis news from around the world
          </p>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="font-medium">To get started:</p>
            <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
              <li>Click the <strong>Settings</strong> icon (⚙️) in the top right</li>
              <li>Select a location type (Region, Country, or City)</li>
              <li>Choose or enter a location</li>
              <li>Click "Add Location" and then "Accept Changes"</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button and Cache Status */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Your News Feed</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Stay informed about crises in locations you care about. Click any article to analyze it and find matching charities.
          <span className="font-medium"> Configure news sources and track locations in </span>
          <button
            onClick={onSettingsClick}
            className="inline-flex items-center gap-1 font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
            aria-label="Open settings"
          >
            Settings
            <Settings className="h-3.5 w-3.5" />
          </button>
          <span className="font-medium"> to personalize your feed.</span>
        </p>
      </div>

      {/* News by Location */}
      {locations.map(location => {
        const articles = newsByLocation.get(location.id) || [];
        const isLocationLoading = loadingLocations.has(location.id);

        return (
          <div key={location.id} className="space-y-3">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              News from {location.displayName}
              {isLocationLoading && (
                <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </h3>

            {isLocationLoading && articles.length === 0 ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="overflow-hidden">
                    <div className="flex gap-4 p-4">
                      <Skeleton className="w-24 h-24 rounded flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-full" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : articles.length === 0 && !isLocationLoading ? (
              <Card className="border-dashed">
                <CardContent className="pt-8 pb-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No recent news found for this location
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {articles.map(article => {
                  const tagColors = article.eventTag ? getEventTagColor(article.eventTag.type) : null;
                  
                  return (
                    <Card
                      key={article.id}
                      className="overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => handleArticleClick(article)}
                    >
                      <div className="flex gap-4 p-4">
                        {article.imageUrl && (
                          <div className="w-24 h-24 rounded overflow-hidden flex-shrink-0 bg-muted">
                            <img
                              src={article.imageUrl}
                              alt=""
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          </div>
                        )}
                        <div className="flex-1 min-w-0 space-y-2">
                          {/* Event Tag */}
                          {article.eventTag && tagColors && (
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs font-medium border",
                                  tagColors.bg,
                                  tagColors.text,
                                  tagColors.border
                                )}
                              >
                                <AlertCircle className="h-3 w-3 mr-1" />
                                {article.eventTag.label}
                              </Badge>
                            </div>
                          )}
                          
                          <h4 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                            {article.title}
                          </h4>
                          {article.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {article.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {article.source}
                            </Badge>
                            <span>•</span>
                            <span>{formatDate(article.publishedAt)}</span>
                          </div>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}