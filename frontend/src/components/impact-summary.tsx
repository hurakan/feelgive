import { Donation } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { TrendingUp, Calendar, DollarSign, Heart, Sparkles } from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';
import { EmptyState } from './empty-state';
import { StorytellerAgent } from '@/utils/storyteller-agent';
import { MonthlyReportCard } from './monthly-report-card';
import { useState } from 'react';

interface ImpactSummaryProps {
  donations: Donation[];
  totalDonated: number;
  currentMonthTotal: number;
  onGetStarted?: () => void;
}

export function ImpactSummary({ 
  donations, 
  totalDonated, 
  currentMonthTotal,
  onGetStarted 
}: ImpactSummaryProps) {
  const [showMonthlyReport, setShowMonthlyReport] = useState(false);

  const currentMonthDonations = donations.filter(d => {
    const date = new Date(d.timestamp);
    const now = new Date();
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  });

  if (donations.length === 0 && onGetStarted) {
    return <EmptyState onGetStarted={onGetStarted} />;
  }

  const monthlyReport = StorytellerAgent.generateMonthlyReport(currentMonthDonations);

  const causeBreakdown = donations.reduce((acc, d) => {
    acc[d.cause] = (acc[d.cause] || 0) + d.amount;
    return acc;
  }, {} as Record<string, number>);

  if (showMonthlyReport) {
    return (
      <div className="space-y-6">
        <div className="flex justify-start">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowMonthlyReport(false)}
            className="gap-2"
          >
            Back to Summary
          </Button>
        </div>
        <MonthlyReportCard 
          report={monthlyReport}
          onTakeAction={() => {
            setShowMonthlyReport(false);
            onGetStarted?.();
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Overall Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs">
              <DollarSign className="h-4 w-4" />
              Total Impact
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${totalDonated}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {donations.length} donation{donations.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="border-2">
          <CardHeader className="pb-3">
            <CardDescription className="flex items-center gap-2 text-xs">
              <Calendar className="h-4 w-4" />
              This Month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">${currentMonthTotal}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonthDonations.length} donation{currentMonthDonations.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Report CTA */}
      {currentMonthDonations.length > 0 && (
        <Card className="border-2 bg-gradient-to-br from-primary/5 to-blue-500/5 hover:from-primary/10 hover:to-blue-500/10 transition-colors cursor-pointer" onClick={() => setShowMonthlyReport(true)}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              View Your Monthly Impact Report
            </CardTitle>
            <CardDescription>
              See the full story of your generosity this month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium">{monthlyReport.headline}</p>
                <p className="text-xs text-muted-foreground">
                  {monthlyReport.achievements.length} achievement{monthlyReport.achievements.length !== 1 ? 's' : ''} unlocked
                </p>
              </div>
              <Button variant="ghost" size="sm">
                View Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Impact Summary */}
      <Card className="border-2 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-primary" />
            Your Impact Story
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm leading-relaxed">{monthlyReport.story}</p>
        </CardContent>
      </Card>

      {/* Cause Breakdown */}
      {Object.keys(causeBreakdown).length > 0 && (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5" />
              
              Causes You Support
            </CardTitle>
            <CardDescription>Where your generosity is making a difference</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(causeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([cause, amount]) => (
                <div key={cause} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">
                      {getCauseLabel(cause as any)}
                    </span>
                  </div>
                  <Badge variant="secondary" className="text-base font-semibold">
                    ${amount}
                  </Badge>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

      {/* Recent Donations */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="text-lg">Recent Donations</CardTitle>
          <CardDescription>Your latest contributions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {donations.slice(0, 10).map((donation, index) => (
              <div key={donation.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{donation.charityName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {getCauseLabel(donation.cause)} • {donation.geo}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-base font-bold text-primary">${donation.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(donation.timestamp).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  {donation.articleTitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 pl-7">
                      "{donation.articleTitle}"
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}