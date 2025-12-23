import { ImpactStory } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Share2, Heart } from 'lucide-react';
import { toast } from 'sonner';

interface ImpactStoryCardProps {
  story: ImpactStory;
  donationAmount: number;
  onShare?: () => void;
}

export function ImpactStoryCard({ story, donationAmount, onShare }: ImpactStoryCardProps) {
  const handleShare = () => {
    const shareText = `${story.shareableQuote}\n\nI just donated $${donationAmount} through FeelGive`;
    
    if (navigator.share) {
      navigator.share({
        title: 'My FeelGive Impact',
        text: shareText,
      }).catch(() => {
        navigator.clipboard.writeText(shareText);
        toast.success('Copied to clipboard!');
      });
    } else {
      navigator.clipboard.writeText(shareText);
      toast.success('Copied to clipboard!');
    }
    
    onShare?.();
  };

  const getToneColor = (tone: ImpactStory['emotionalTone']) => {
    switch (tone) {
      case 'hopeful':
        return 'from-blue-500/10 to-cyan-500/10 border-blue-500/20';
      case 'urgent':
        return 'from-orange-500/10 to-red-500/10 border-orange-500/20';
      case 'grateful':
        return 'from-purple-500/10 to-pink-500/10 border-purple-500/20';
      case 'inspiring':
        return 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20';
      default:
        return 'from-primary/10 to-blue-500/10 border-primary/20';
    }
  };

  const getToneIcon = (tone: ImpactStory['emotionalTone']) => {
    // Return empty string instead of emojis
    return '';
  };

  return (
    <Card className={`w-full border-2 bg-gradient-to-br ${getToneColor(story.emotionalTone)}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl">
              Your Impact Story
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main narrative */}
        <div className="p-4 rounded-lg bg-background/60 backdrop-blur border-2">
          <p className="text-base leading-relaxed text-foreground/90">
            {story.narrative}
          </p>
        </div>

        {/* Shareable quote */}
        <div className="p-4 rounded-lg bg-primary/5 border-2 border-primary/20">
          <div className="flex items-start gap-3">
            <Heart className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" fill="currentColor" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-2">Share Your Impact</p>
              <p className="text-base font-semibold text-foreground italic">
                "{story.shareableQuote}"
              </p>
            </div>
          </div>
        </div>

        {/* Visual suggestion */}
        <div className="text-center text-xs text-muted-foreground p-3 rounded-lg bg-muted/30">
          <p className="italic">{story.visualSuggestion}</p>
        </div>

        {/* Share button */}
        <Button 
          onClick={handleShare}
          className="w-full h-12 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
        >
          <Share2 className="mr-2 h-4 w-4" />
          Share Your Impact
        </Button>

        {/* Follow-up teaser */}
        {story.followUpStory && (
          <div className="text-center p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-xs text-amber-800 dark:text-amber-200">
              <strong>Coming soon:</strong> We'll send you an update in one week showing the continued impact of your donation!
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}