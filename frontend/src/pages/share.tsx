import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function Share() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    // Extract shared data from URL params
    const sharedUrl = searchParams.get('url');
    const sharedText = searchParams.get('text');
    const sharedTitle = searchParams.get('title');

    // Store in sessionStorage for the main app to pick up
    if (sharedUrl || sharedText) {
      const sharedData = {
        url: sharedUrl || '',
        text: sharedText || '',
        title: sharedTitle || '',
        timestamp: Date.now()
      };
      
      sessionStorage.setItem('feelgive_shared_content', JSON.stringify(sharedData));
      
      // Redirect to main app
      navigate('/', { replace: true });
    } else {
      // No shared data, just go to home
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Processing Shared Content</CardTitle>
          <CardDescription>Please wait while we prepare your donation...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </CardContent>
      </Card>
    </div>
  );
}