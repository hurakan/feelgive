import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Sparkles, FileText, Brain, Heart } from 'lucide-react';

interface LoadingStateProps {
  stage: 'fetching' | 'analyzing' | 'matching';
}

const LOADING_MESSAGES = {
  fetching: { icon: FileText, text: 'Reading the article...', subtext: 'Extracting key information' },
  analyzing: { icon: Brain, text: 'Analyzing the content...', subtext: 'Identifying the cause and needs' },
  matching: { icon: Heart, text: 'Finding organizations...', subtext: 'Matching with trusted charities' },
};

export function LoadingState({ stage }: LoadingStateProps) {
  const message = LOADING_MESSAGES[stage];
  const CurrentIcon = message.icon;

  return (
    <Card className="w-full border-2">
      <CardHeader className="text-center pb-4">
        <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CurrentIcon className="h-8 w-8 text-primary animate-pulse" />
        </div>
      </CardHeader>
      <CardContent className="text-center space-y-3 pb-8">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-spin" />
            {message.text}
          </h3>
          <p className="text-sm text-muted-foreground">
            {message.subtext}
          </p>
        </div>
        
        {/* Progress bar */}
        <div className="w-full max-w-xs mx-auto mt-6">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-out"
              style={{ 
                width: stage === 'fetching' ? '33%' : stage === 'analyzing' ? '66%' : '100%' 
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}