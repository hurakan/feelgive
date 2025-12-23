import { useState } from 'react';
import { Classification, Charity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { Lightbulb, MapPin, Target, Shield, TrendingUp, Search, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';

interface ClassificationReasoningProps {
  classification: Classification;
  matchedCharities: Charity[];
}

export function ClassificationReasoning({ classification, matchedCharities }: ClassificationReasoningProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Calculate average trust score
  const avgTrustScore = Math.round(
    matchedCharities.reduce((sum, c) => sum + c.trustScore, 0) / matchedCharities.length
  );

  // Count vetting levels
  const vettingCounts = matchedCharities.reduce((acc, c) => {
    acc[c.vettingLevel] = (acc[c.vettingLevel] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const hasDirectVetting = vettingCounts['pg_direct'] > 0;
  const hasPartnerReview = vettingCounts['partner_pg_review'] > 0;

  return (
    <Card className="w-full border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/50 dark:from-blue-950/30 dark:to-cyan-950/20 dark:border-blue-800">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-xl">How We Matched You</CardTitle>
                <CardDescription className="text-sm">
                  {isOpen ? 'See the reasoning behind our recommendations' : 'Click to see our matching process'}
                </CardDescription>
              </div>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-shrink-0">
                {isOpen ? (
                  <ChevronUp className="h-5 w-5" />
                ) : (
                  <ChevronDown className="h-5 w-5" />
                )}
                <span className="sr-only">{isOpen ? 'Hide' : 'Show'} matching details</span>
              </Button>
            </CollapsibleTrigger>
          </div>
        </CardHeader>

        <CollapsibleContent>
          <CardContent className="space-y-5 pt-0">
            {/* Article Content Analysis */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                What We Found in the Article
              </div>
              <div className="pl-6 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Key Indicators Detected:</p>
                  <div className="flex flex-wrap gap-2">
                    {classification.matchedKeywords.slice(0, 10).map((keyword, index) => (
                      <Badge 
                        key={index} 
                        variant="secondary" 
                        className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                      >
                        {keyword}
                      </Badge>
                    ))}
                    {classification.matchedKeywords.length > 10 && (
                      <Badge variant="secondary" className="text-xs">
                        +{classification.matchedKeywords.length - 10} more
                      </Badge>
                    )}
                  </div>
                </div>
                
                {classification.relevantExcerpts.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">Most Relevant Content:</p>
                    <div className="space-y-2">
                      {classification.relevantExcerpts.map((excerpt, index) => (
                        <div 
                          key={index}
                          className="p-3 rounded-lg bg-white/60 dark:bg-slate-800/60 border border-blue-200/50 dark:border-blue-800/50"
                        >
                          <p className="text-xs leading-relaxed text-foreground/70 italic">
                            "{excerpt}..."
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs leading-relaxed text-foreground/70">
                      Our AI uses <strong>contextual semantic analysis</strong> to understand the article's meaning, not just keyword matching. 
                      We look for crisis indicators, action language, and actual humanitarian needs while filtering out political discussions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cause Detection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Target className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Cause Identified
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-sm leading-relaxed text-foreground/70">
                  Based on contextual analysis of the content above, we identified this as a <strong className="text-foreground">{getCauseLabel(classification.cause)}</strong> situation
                  {classification.affectedGroups.length > 0 && (
                    <> affecting <strong className="text-foreground">{classification.affectedGroups[0]}</strong></>
                  )}.
                </p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {Math.round(classification.confidence * 100)}% confidence
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    ({classification.matchedKeywords.length} contextual indicators)
                  </span>
                </div>
              </div>
            </div>

            {/* Geographic Relevance */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Geographic Focus
              </div>
              <div className="pl-6">
                <p className="text-sm leading-relaxed text-foreground/70">
                  The situation is in <strong className="text-foreground">{classification.geoName}</strong>. 
                  We prioritized organizations that work in this region or have global reach to help effectively.
                </p>
              </div>
            </div>

            {/* Organization Selection */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <Shield className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Why These Organizations
              </div>
              <div className="pl-6 space-y-3">
                <p className="text-sm leading-relaxed text-foreground/70">
                  We selected {matchedCharities.length} trusted {matchedCharities.length === 1 ? 'organization' : 'organizations'} based on:
                </p>
                <ul className="space-y-2 text-sm text-foreground/70">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Geographic proximity (PRIMARY):</strong> Organizations operating directly in {classification.geoName} are ranked first, followed by regional and global responders
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Cause alignment (SECONDARY):</strong> All specialize in {getCauseLabel(classification.cause).toLowerCase()} or related expertise
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Trust score (TIEBREAKER):</strong> Average trust score of {avgTrustScore}% (transparency, financial health, impact effectiveness)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 mt-0.5">•</span>
                    <span>
                      <strong className="text-foreground">Vetting quality:</strong> {hasDirectVetting && 'Includes directly vetted organizations'}
                      {!hasDirectVetting && hasPartnerReview && 'All partner-reviewed organizations'}
                      {!hasDirectVetting && !hasPartnerReview && 'All partner-vetted organizations'}
                    </span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Ranking Explanation */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground/80">
                <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Ranking Order
              </div>
              <div className="pl-6">
                <p className="text-sm leading-relaxed text-foreground/70">
                  Organizations are ranked using a <strong className="text-foreground">hierarchical tiered system</strong>:
                  (1) Geographic proximity to the crisis is the primary factor, ensuring local organizations are prioritized.
                  (2) Cause alignment and specific needs matching is secondary.
                  (3) Trust score serves as the final tiebreaker when organizations are equally relevant geographically and by cause.
                </p>
              </div>
            </div>

            {/* Trust Note */}
            <div className="mt-4 p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p className="text-xs leading-relaxed text-foreground/70">
                <strong className="text-foreground">Our commitment:</strong> All organizations are vetted through our partner network 
                or directly by FeelGive. We continuously monitor their performance and impact to ensure your donations create real change.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}