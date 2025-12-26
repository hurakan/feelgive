import { Classification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getCauseLabel } from '@/utils/classification';
import { MapPin, Users, FileText, ArrowDown, ExternalLink } from 'lucide-react';

interface ClassificationResultProps {
  classification: Classification;
  articleSummary?: string;
}

export function ClassificationResult({ classification, articleSummary }: ClassificationResultProps) {
  const confidencePercent = Math.round(classification.confidence * 100);
  
  return (
    <div className="space-y-6 w-full">
      {/* Article Summary */}
      {articleSummary && (
        <Card className="w-full bg-gradient-to-br from-muted/50 to-muted/30 border-2">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wide">What We Read</span>
            </div>
            {classification.articleTitle && (
              <CardTitle className="text-lg leading-snug">
                {classification.articleTitle}
              </CardTitle>
            )}
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm leading-relaxed text-foreground/80">
              {articleSummary}
            </p>
            
            {/* Source Link */}
            {classification.articleUrl && classification.articleUrl !== 'pasted-content' ? (
              <div className="pt-2 border-t border-border/50">
                <a
                  href={classification.articleUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors group"
                >
                  <ExternalLink className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  <span className="font-medium">View original article</span>
                </a>
              </div>
            ) : classification.articleUrl === 'pasted-content' ? (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground italic">
                  Content provided via "Paste Text" tab
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
      
      {/* Classification Result - Compact Version */}
      <div className="flex justify-center">
        <ArrowDown className="h-6 w-6 text-muted-foreground" />
      </div>
      
      <Card className="w-full border-2 border-primary/30 shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="text-2xl text-center">
            {getCauseLabel(classification.cause)}
          </CardTitle>
          <CardDescription className="text-base text-center mt-2">
            We found organizations helping with this cause
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Compact info display */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <span className="font-medium">{classification.geoName}</span>
            </div>
            
            <div className="h-4 w-px bg-border" />
            
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">{classification.affectedGroups[0]}</span>
            </div>
          </div>

          <div className="text-center pt-2">
            <Badge variant="secondary" className="text-sm px-4 py-2">
              {confidencePercent}% confidence match
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}