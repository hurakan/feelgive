import { Classification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Heart, AlertCircle, ArrowLeft, Mail } from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';

interface NoCharitiesAvailableProps {
  classification: Classification;
  onBack: () => void;
}

export function NoCharitiesAvailable({ classification, onBack }: NoCharitiesAvailableProps) {
  const handleNotifyMe = () => {
    // In production, this would open a form to collect email
    window.open(`mailto:support@feelgive.com?subject=Notify me about ${getCauseLabel(classification.cause)} organizations&body=I'm interested in supporting organizations related to: ${classification.articleTitle || classification.articleUrl}`, '_blank');
  };

  return (
    <div className="space-y-6 w-full">
      <div className="flex justify-start">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onBack}
          className="gap-2 text-muted-foreground hover:text-foreground transition-all duration-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Try Different Article
        </Button>
      </div>

      <Card className="w-full border-2 border-amber-200 bg-gradient-to-br from-amber-50/80 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20 dark:border-amber-800">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-3 w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center">
            <span className="text-sm font-bold text-amber-600 dark:text-amber-400">{getCauseLabel(classification.cause).substring(0, 2).toUpperCase()}</span>
          </div>
          <CardTitle className="text-2xl">We Detected a Crisis</CardTitle>
          <CardDescription className="text-base mt-2">
            But we don't have matching organizations yet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* What We Detected */}
          <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm leading-relaxed">
              <strong>What we found:</strong> This article appears to be about a <strong>{getCauseLabel(classification.cause).toLowerCase()}</strong> situation
              {classification.geoName && <> in <strong>{classification.geoName}</strong></>}
              {classification.affectedGroups.length > 0 && <> affecting <strong>{classification.affectedGroups[0]}</strong></>}.
            </AlertDescription>
          </Alert>

          {/* Detected Themes */}
          {classification.detectedThemes && classification.detectedThemes.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/80">Key themes detected:</p>
              <div className="flex flex-wrap gap-2">
                {classification.detectedThemes.map((theme, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 rounded-full text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                  >
                    {theme}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Relevant Excerpts */}
          {classification.relevantExcerpts.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground/80">From the article:</p>
              <div className="space-y-2">
                {classification.relevantExcerpts.slice(0, 2).map((excerpt, index) => (
                  <div 
                    key={index}
                    className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-amber-200/50 dark:border-amber-800/50"
                  >
                    <p className="text-xs leading-relaxed text-foreground/70 italic">
                      "{excerpt}..."
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Why No Organizations */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm leading-relaxed text-foreground/70">
              <strong className="text-foreground">Why we can't help yet:</strong> While we detected a crisis situation, 
              we don't currently have vetted organizations in our network that specifically address this type of need. 
              We're constantly expanding our partner organizations to cover more causes.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              onClick={handleNotifyMe}
              className="w-full h-12 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            >
              <Mail className="mr-2 h-4 w-4" />
              Notify Me When Available
            </Button>
            
            <Button 
              variant="outline"
              onClick={onBack}
              className="w-full h-12"
            >
              Try a Different Article
            </Button>
          </div>

          {/* Transparency Note */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              We're committed to transparency. Even when we can't help directly, 
              we show you what our AI detected so you understand our process.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}