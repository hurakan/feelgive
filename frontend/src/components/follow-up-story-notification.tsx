import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { StorytellerAgent } from '@/utils/storyteller-agent';
import { FollowUpStory } from '@/types';
import { getDonations } from '@/utils/donations';

export function FollowUpStoryNotification() {
  const [pendingStories, setPendingStories] = useState<FollowUpStory[]>([]);
  const [currentStory, setCurrentStory] = useState<FollowUpStory | null>(null);

  useEffect(() => {
    // Check for pending follow-up stories
    const stories = StorytellerAgent.getPendingFollowUpStories();
    setPendingStories(stories);
    
    if (stories.length > 0) {
      setCurrentStory(stories[0]);
    }
  }, []);

  const handleDismiss = () => {
    if (currentStory) {
      StorytellerAgent.markFollowUpDelivered(currentStory.donationId);
      
      // Show next story if available
      const remaining = pendingStories.filter(s => s.donationId !== currentStory.donationId);
      setPendingStories(remaining);
      setCurrentStory(remaining.length > 0 ? remaining[0] : null);
    }
  };

  if (!currentStory) return null;

  // Get the original donation details
  const donations = getDonations();
  const donation = donations.find(d => d.id === currentStory.donationId);

  return (
    <Card className="w-full border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/80 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20 shadow-lg animate-in slide-in-from-top duration-500">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Impact Update! 🎉</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                One week after your ${donation?.amount} donation
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismiss}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 rounded-lg bg-background/60 backdrop-blur border-2">
          <p className="text-base leading-relaxed text-foreground/90">
            {currentStory.story}
          </p>
        </div>

        {pendingStories.length > 1 && (
          <p className="text-xs text-center text-muted-foreground">
            {pendingStories.length - 1} more update{pendingStories.length - 1 !== 1 ? 's' : ''} waiting
          </p>
        )}

        <Button 
          onClick={handleDismiss}
          variant="outline"
          className="w-full"
        >
          Got it, thanks!
        </Button>
      </CardContent>
    </Card>
  );
}