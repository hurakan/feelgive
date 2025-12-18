import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Home, Heart } from 'lucide-react';

export default function DonationSuccess() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    // Auto-redirect to home after 10 seconds
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-2 shadow-lg">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold">
            Thank You for Your Donation!
          </CardTitle>
          <CardDescription className="text-lg">
            Your generosity makes a real difference in the world
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Your donation is being processed</h3>
                <p className="text-sm text-muted-foreground">
                  You should receive a confirmation email from Every.org shortly with your donation receipt.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-1">Track your impact</h3>
                <p className="text-sm text-muted-foreground">
                  Your donation will be recorded in your FeelGive profile, and you'll receive updates about the impact you're making.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              Redirecting to home in {countdown} seconds...
            </p>
            
            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => navigate('/')}
                className="gap-2"
              >
                <Home className="h-4 w-4" />
                Return Home Now
              </Button>
            </div>
          </div>

          <div className="border-t pt-6">
            <p className="text-xs text-center text-muted-foreground">
              If you have any questions about your donation, please contact{' '}
              <a 
                href="https://www.every.org/contact" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Every.org support
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}