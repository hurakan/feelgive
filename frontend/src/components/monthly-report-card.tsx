import { MonthlyReport } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, Award, Target, ArrowRight, Trophy, Star } from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';

interface MonthlyReportCardProps {
  report: MonthlyReport;
  onTakeAction?: () => void;
}

export function MonthlyReportCard({ report, onTakeAction }: MonthlyReportCardProps) {
  return (
    <div className="space-y-6 w-full">
      {/* Header Card */}
      <Card className="w-full border-2 shadow-xl bg-gradient-to-br from-primary/10 via-blue-50/50 to-purple-50/30 dark:from-primary/20 dark:via-blue-950/30 dark:to-purple-950/20">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-4 w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg">
            <Trophy className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            {report.headline}
          </CardTitle>
          <CardDescription className="text-base mt-3 max-w-2xl mx-auto">
            {report.story}
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Achievements */}
      {report.achievements.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Award className="h-5 w-5 text-amber-500" />
              Your Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {report.achievements.map((achievement, index) => (
                <Badge 
                  key={index}
                  variant="secondary"
                  className="text-sm px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 border-amber-300 dark:border-amber-700"
                >
                  {achievement}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Impact Metrics */}
      {report.impactMetrics.length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-xl">
              <TrendingUp className="h-5 w-5 text-primary" />
              Your Impact This Month
            </CardTitle>
            <CardDescription>Tangible results from your generosity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {report.impactMetrics.map((metric, index) => (
                <div 
                  key={index}
                  className="p-4 rounded-lg bg-gradient-to-br from-primary/5 to-blue-500/5 border-2 border-primary/20 hover:border-primary/40 transition-colors"
                >
                  <div className="text-3xl mb-2">{metric.icon}</div>
                  <div className="text-3xl font-bold text-primary mb-1">{metric.value}</div>
                  <div className="text-sm font-medium text-foreground mb-1">{metric.label}</div>
                  <div className="text-xs text-muted-foreground">{metric.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Total Impact Summary */}
      <Card className="border-2 bg-gradient-to-br from-emerald-50/50 to-teal-50/30 dark:from-emerald-950/20 dark:to-teal-950/10">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Star className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="currentColor" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Total Impact</h3>
              <p className="text-base leading-relaxed text-foreground/80">
                {report.totalImpact}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparison to Others */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-purple-500/10 flex items-center justify-center flex-shrink-0">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">How You Compare</h3>
              <p className="text-base leading-relaxed text-foreground/80">
                {report.comparisonToOthers}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Cause */}
      <Card className="border-2">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-primary">{getCauseLabel(report.topCause).substring(0, 2).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2">Your Top Cause</h3>
              <p className="text-base leading-relaxed text-foreground/80">
                You've been most passionate about <strong>{getCauseLabel(report.topCause)}</strong> this month. 
                Your focus is creating concentrated impact in this area.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suggested Next Action */}
      <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-cyan-50/30 dark:from-blue-950/20 dark:to-cyan-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            Keep Growing Your Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-base leading-relaxed text-foreground/80">
            {report.suggestedNextAction}
          </p>
          
          {onTakeAction && (
            <Button 
              onClick={onTakeAction}
              size="lg"
              className="w-full h-12 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
            >
              Find Your Next Cause
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </CardContent>
      </Card>

      <Separator className="my-8" />

      {/* Footer Message */}
      <div className="text-center p-6 rounded-lg bg-gradient-to-r from-primary/5 to-blue-500/5 border-2 border-primary/20">
        <p className="text-base font-medium text-foreground/80">
          Thank you for being part of the FeelGive community.
          Your generosity is creating real, measurable change in the world.
        </p>
      </div>
    </div>
  );
}