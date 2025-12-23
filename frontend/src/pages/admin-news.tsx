import { NewsAPIAdmin } from '@/components/news-api-admin';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/**
 * Admin page for managing News API sources
 * 
 * This page provides:
 * - News API source management
 * - Usage monitoring and statistics
 * - Manual news fetching
 * - Rate limit tracking
 * 
 * To add this page to your app:
 * 1. Add route in your router configuration
 * 2. Link from settings or admin menu
 * 3. Protect with authentication if needed
 */
export default function AdminNewsPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-7xl">
        {/* Header */}
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">News API Management</h1>
            <p className="text-muted-foreground text-lg">
              Configure news sources, monitor API usage, and fetch crisis-related articles
            </p>
          </div>
        </div>

        {/* Main Content */}
        <NewsAPIAdmin />

        {/* Help Section */}
        <div className="mt-8 p-6 bg-muted/50 rounded-lg border">
          <h3 className="text-lg font-semibold mb-3">Quick Start Guide</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>1. Get API Keys:</strong> Sign up for free accounts at your preferred news API providers
            </li>
            <li>
              <strong>2. Add Source:</strong> Click "Add Source" button above and enter your API key
            </li>
            <li>
              <strong>3. Fetch News:</strong> Click "Fetch News Now" to get the latest crisis articles
            </li>
            <li>
              <strong>4. Monitor Usage:</strong> Check the Usage Statistics tab to stay within free tier limits
            </li>
            <li>
              <strong>5. Automate:</strong> Set up a cron job for periodic fetching (see documentation)
            </li>
          </ol>
          
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              <strong>Full Documentation:</strong>{' '}
              <code className="text-xs bg-background px-2 py-1 rounded">NEWS_API_TESTING_GUIDE.md</code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}