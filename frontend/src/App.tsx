import { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import Share from "./pages/share";
import TestClassification from "./pages/test-classification";
import DonationSuccess from "./pages/donation-success";
import AdminNewsPage from "./pages/admin-news";
import AdminAnalytics from "./pages/admin-analytics";
import NotFound from "./pages/NotFound";
import analyticsTracker from "@/utils/analytics-tracker";

const queryClient = new QueryClient();

/**
 * Analytics Provider - Tracks page views on route changes
 */
function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Initialize analytics tracker on mount
    analyticsTracker.initialize();

    // Cleanup on unmount
    return () => {
      analyticsTracker.destroy();
    };
  }, []);

  useEffect(() => {
    // Track page view on route change
    analyticsTracker.track('page_view', {
      category: 'navigation',
      metadata: {
        path: location.pathname,
        search: location.search,
        hash: location.hash,
      },
    });
  }, [location]);

  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AnalyticsProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/share" element={<Share />} />
            <Route path="/test-classification" element={<TestClassification />} />
            <Route path="/donation-success" element={<DonationSuccess />} />
            <Route path="/admin/news" element={<AdminNewsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AnalyticsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;