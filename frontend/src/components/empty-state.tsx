import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Sparkles, TrendingUp } from 'lucide-react';

interface EmptyStateProps {
  onGetStarted: () => void;
}

export function EmptyState({ onGetStarted }: EmptyStateProps) {
  return (
    <Card className="w-full border-2 border-dashed">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="text-2xl">Your Impact Journey Starts Here</CardTitle>
        <CardDescription className="text-base mt-2 max-w-md mx-auto">
          When you see a story that moves you, FeelGive makes it easy to turn that emotion into action
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-8">
        <div className="space-y-4 max-w-sm mx-auto">
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">1</span>
            </div>
            <div>
              <p className="font-medium">Share an article</p>
              <p className="text-sm text-muted-foreground">Paste any news link that touched your heart</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">2</span>
            </div>
            <div>
              <p className="font-medium">We find the cause</p>
              <p className="text-sm text-muted-foreground">AI identifies relevant organizations</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 text-left">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-sm font-bold text-primary">3</span>
            </div>
            <div>
              <p className="font-medium">Make an impact</p>
              <p className="text-sm text-muted-foreground">Quick donation in just a few clicks</p>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <Button 
            size="lg" 
            onClick={onGetStarted}
            className="w-full max-w-xs mx-auto flex items-center gap-2"
          >
            <Sparkles className="h-5 w-5" />
            Get Started
          </Button>
        </div>

        <div className="text-center pt-2">
          <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
            <TrendingUp className="h-3 w-3" />
            Join thousands making a difference, one story at a time
          </p>
        </div>
      </CardContent>
    </Card>
  );
}