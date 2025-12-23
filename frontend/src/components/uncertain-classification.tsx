import { Classification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, HelpCircle, ArrowLeft, MessageSquare, Lightbulb } from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';

interface UncertainClassificationProps {
  classification: Classification;
  onBack: () => void;
  onFeedback?: () => void;
}

export function UncertainClassification({ 
  classification, 
  onBack,
  onFeedback 
}: UncertainClassificationProps) {
  const confidencePercent = Math.round(classification.confidence * 100);

  const getDetailedExplanation = (): { reason: string; suggestions: string[] } => {
    // No keywords matched at all
    if (classification.matchedKeywords.length === 0) {
      return {
        reason: "The article content doesn't strongly match any of our crisis categories. This could be because the article is more about political discussion, policy debate, or general news rather than an active crisis requiring immediate humanitarian response.",
        suggestions: [
          "Look for articles that describe active emergencies or disasters",
          "Focus on stories about people in immediate need of help",
          "Try articles from humanitarian news sections rather than political analysis"
        ]
      };
    }

    // Very few keywords matched
    if (classification.matchedKeywords.length < 5) {
      return {
        reason: "We found limited crisis-related indicators in the article. The content may be discussing the situation from a political, historical, or analytical perspective rather than focusing on immediate humanitarian needs.",
        suggestions: [
          "Look for articles that focus on the human impact of events",
          "Try stories that describe specific needs (food, shelter, medical care)",
          "Search for articles with words like 'emergency', 'crisis', 'relief efforts'"
        ]
      };
    }

    // Keywords matched but no clear excerpts
    if (classification.relevantExcerpts.length === 0) {
      return {
        reason: "While we detected some relevant keywords, we couldn't identify clear passages describing an active crisis or humanitarian emergency that requires immediate support. The article may mention crisis-related topics without focusing on actionable humanitarian needs.",
        suggestions: [
          "Look for articles with detailed descriptions of the situation on the ground",
          "Try stories that include quotes from aid workers or affected people",
          "Search for articles about ongoing relief operations"
        ]
      };
    }

    // Low confidence despite some matches
    if (confidencePercent < 40) {
      return {
        reason: "The article contains mixed signals that make it difficult to confidently classify. It may discuss multiple topics, focus on political aspects rather than humanitarian needs, or approach the situation from an analytical rather than crisis-response perspective.",
        suggestions: [
          "Look for articles from humanitarian organizations' news sections",
          "Try stories that focus on relief efforts and aid distribution",
          "Search for articles about specific disasters or emergencies"
        ]
      };
    }

    // Default explanation
    return {
      reason: "We detected some crisis-related content, but not enough clear indicators to confidently match you with organizations. The article may be discussing the situation from a broader perspective rather than focusing on immediate humanitarian response needs.",
      suggestions: [
        "Look for articles that describe active relief operations",
        "Try stories about specific disasters or emergencies",
        "Search for articles from humanitarian news sources"
      ]
    };
  };

  const { reason, suggestions } = getDetailedExplanation();

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
            <HelpCircle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
          </div>
          <CardTitle className="text-2xl">We're Not Quite Sure About This One</CardTitle>
          <CardDescription className="text-base mt-2">
            Our AI couldn't confidently classify this article
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Confidence Score */}
          <Alert className="border-amber-200 bg-amber-50/50 dark:bg-amber-900/20">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertDescription className="text-sm leading-relaxed">
              <strong>Confidence Level: {confidencePercent}%</strong>
              <br />
              We need at least 50% confidence to show you organizations. This article scored below our threshold.
            </AlertDescription>
          </Alert>

          {/* What We Detected (if anything) */}
          {classification.detectedThemes && classification.detectedThemes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground/80">What We Detected:</h3>
              <div className="p-4 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-sm font-bold text-primary">{getCauseLabel(classification.cause).substring(0, 2).toUpperCase()}</span>
                  <div>
                    <p className="font-medium">{getCauseLabel(classification.cause)}</p>
                    {classification.geoName && (
                      <p className="text-sm text-muted-foreground">Location: {classification.geoName}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {classification.detectedThemes.slice(0, 8).map((theme, index) => (
                    <Badge 
                      key={index}
                      variant="secondary"
                      className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                    >
                      {theme}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Relevant Excerpts (if any) */}
          {classification.relevantExcerpts.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground/80">Relevant passages we found:</h3>
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

          {/* Why We're Uncertain */}
          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <h3 className="text-sm font-semibold text-foreground/80 mb-2 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              Why We're Uncertain
            </h3>
            <p className="text-sm leading-relaxed text-foreground/70">
              {reason}
            </p>
          </div>

          {/* What to Look For */}
          <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
            <h3 className="text-sm font-semibold text-foreground/80 mb-3 flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              What to Look For Instead
            </h3>
            <ul className="space-y-2">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-foreground/70">
                  <span className="text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* What This Means */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground/80">What This Means:</h3>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>
                  <strong>Not a technical error:</strong> Our system is working correctly, but this article doesn't clearly describe an active humanitarian crisis requiring immediate support.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>
                  <strong>Being cautious:</strong> We'd rather be honest about uncertainty than show you organizations that might not be the right match.
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                <span>
                  <strong>Your feedback helps:</strong> Let us know if you think we missed something - it helps us improve our classification.
                </span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <Button 
              variant="outline"
              onClick={onBack}
              className="w-full h-12"
            >
              Try a Different Article
            </Button>
            
            {onFeedback && (
              <Button 
                variant="ghost"
                onClick={onFeedback}
                className="w-full h-10 text-sm"
              >
                <MessageSquare className="mr-2 h-4 w-4" />
                Help Us Improve (Send Feedback)
              </Button>
            )}
          </div>

          {/* Transparency Note */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              We're committed to transparency. We show you exactly what we detected and why we're uncertain, 
              so you can make informed decisions about where to donate.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}