import { Charity, RankedCharity } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Building2,
  Calendar,
  MapPin,
  Globe,
  Target,
  TrendingUp,
  Users,
  Award,
  ExternalLink,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Shield,
  CheckCircle2,
  AlertCircle,
  Info,
  Lightbulb,
  Zap,
  Heart
} from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';
import { getVettingLevelLabel } from '@/utils/charity-matching';

interface OrganizationProfileProps {
  charity: Charity | RankedCharity;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDonate?: () => void;
}

export function OrganizationProfile({ charity, open, onOpenChange, onDonate }: OrganizationProfileProps) {
  const profile = charity.profile;
  const rankedCharity = 'recommendation_reasons' in charity ? charity as RankedCharity : null;
  const hasRecommendationReasons = rankedCharity && rankedCharity.recommendation_reasons.length > 0;
  const dataCompleteness = rankedCharity?.data_completeness;
  const hasIncompleteData = dataCompleteness && dataCompleteness.completeness_score < 70;

  const getTrustBadgeColor = (score?: number) => {
    if (!score) return 'bg-muted text-muted-foreground';
    if (score >= 95) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 90) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };

  const socialIcons = {
    twitter: Twitter,
    facebook: Facebook,
    instagram: Instagram,
    linkedin: Linkedin,
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-4 pb-4">
          {/* Header with trust score */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl leading-tight mb-2">
                {charity.name}
              </DialogTitle>
              <DialogDescription className="text-base">
                {charity.description}
              </DialogDescription>
            </div>
            {charity.trustScore && (
              <Badge
                variant="outline"
                className={`font-semibold text-sm px-3 py-1 flex-shrink-0 ${getTrustBadgeColor(charity.trustScore)}`}
              >
                <Shield className="h-3 w-3 mr-1" />
                {charity.trustScore}% Trust
              </Badge>
            )}
          </div>

          {/* Quick stats bar */}
          {profile && (
            <div className="grid grid-cols-3 gap-3">
              {profile.yearFounded && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Calendar className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Founded</p>
                  <p className="text-sm font-semibold">{profile.yearFounded}</p>
                </div>
              )}
              {profile.headquarters && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <MapPin className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Headquarters</p>
                  <p className="text-sm font-semibold">{profile.headquarters}</p>
                </div>
              )}
              {charity.vettingLevel && (
                <div className="text-center p-3 rounded-lg bg-muted/50">
                  <Award className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground">Vetting</p>
                  <p className="text-sm font-semibold">{getVettingLevelLabel(charity.vettingLevel)}</p>
                </div>
              )}
            </div>
          )}
        </DialogHeader>

        <div className="space-y-6">
          {/* Data Completeness Warning */}
          {hasIncompleteData && (
            <Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                      Limited Information Available
                    </p>
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                      Some details about this organization are not available in our database.
                      {!dataCompleteness?.has_website && ' No website link is available.'}
                      {!dataCompleteness?.has_description && ' Detailed description is missing.'}
                      {' '}We recommend verifying the organization independently before donating.
                    </p>
                    {charity.websiteUrl && (
                      <a
                        href={charity.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-300 hover:underline"
                      >
                        Visit their website for more information
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Why We Recommend This Organization */}
          {hasRecommendationReasons && (
            <section>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Why We Recommend This Organization
              </h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-3">
                    {rankedCharity.recommendation_reasons.map((reason, idx) => {
                      const Icon = reason.type === 'geographic' ? MapPin :
                                   reason.type === 'cause' ? Target :
                                   reason.type === 'trust' ? Shield :
                                   reason.type === 'needs' ? Heart :
                                   reason.type === 'rapid_response' ? Zap :
                                   reason.type === 'vetting' ? Award : CheckCircle2;
                      
                      const strengthColor = reason.strength === 'primary' ? 'text-primary' :
                                           reason.strength === 'secondary' ? 'text-blue-600 dark:text-blue-400' :
                                           'text-muted-foreground';
                      
                      return (
                        <div key={idx} className="flex items-start gap-3">
                          <Icon className={`h-4 w-4 mt-0.5 flex-shrink-0 ${strengthColor}`} />
                          <div className="space-y-1 flex-1">
                            <p className="text-sm font-medium">{reason.label}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {reason.description}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <Separator />
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="how-ranking-works" className="border-none">
                      <AccordionTrigger className="text-xs text-muted-foreground hover:text-foreground py-2">
                        <div className="flex items-center gap-2">
                          <Info className="h-3.5 w-3.5" />
                          How this ranking works
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="text-xs text-muted-foreground space-y-2 pt-2">
                        <p>
                          We prioritize organizations based on three key factors:
                        </p>
                        <ol className="list-decimal list-inside space-y-1 ml-2">
                          <li><strong>Geographic proximity:</strong> Organizations operating directly in or near the crisis area are ranked highest.</li>
                          <li><strong>Cause alignment:</strong> Organizations with expertise matching the specific crisis type and identified needs.</li>
                          <li><strong>Trust & credibility:</strong> Verified organizations with strong track records and transparency.</li>
                        </ol>
                        <p className="pt-2">
                          This ensures your donation reaches organizations best positioned to make an immediate impact.
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Identity & Basics */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Organization Details
            </h3>
            <Card>
              <CardContent className="pt-6 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Legal Name - always show */}
                  <div>
                    <p className="text-muted-foreground mb-1">Legal Name</p>
                    <p className="font-medium">{profile?.fullLegalName || charity.name}</p>
                  </div>
                  
                  {profile?.dbaName && (
                    <div>
                      <p className="text-muted-foreground mb-1">Also Known As</p>
                      <p className="font-medium">{profile.dbaName}</p>
                    </div>
                  )}
                  
                  {/* Registration/EIN */}
                  {(profile?.registrationNumber || charity.ein) && (
                    <div>
                      <p className="text-muted-foreground mb-1">Registration / EIN</p>
                      <p className="font-medium font-mono text-xs">
                        {profile?.registrationNumber || charity.ein}
                      </p>
                    </div>
                  )}
                  
                  {/* Website - with fallback */}
                  <div>
                    <p className="text-muted-foreground mb-1">Website</p>
                    {(profile?.website || charity.websiteUrl) ? (
                      <a
                        href={profile?.website || charity.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-1 font-medium"
                      >
                        Visit Site <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <p className="text-muted-foreground text-xs italic">Not available</p>
                    )}
                  </div>
                  
                  {/* Location */}
                  {(profile?.headquarters || charity.locationAddress) && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Location</p>
                      <p className="font-medium text-xs">
                        {profile?.headquarters || charity.locationAddress}
                      </p>
                    </div>
                  )}
                  
                  {/* Data Source */}
                  {charity.dataSource && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">Data Source</p>
                      <p className="text-xs">
                        {charity.dataSource}
                        {charity.lastUpdated && (
                          <span className="text-muted-foreground ml-2">
                            • Updated {new Date(charity.lastUpdated).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                {profile?.socialLinks && Object.keys(profile.socialLinks).length > 0 && (
                  <>
                    <Separator className="my-3" />
                    <div>
                      <p className="text-muted-foreground text-sm mb-2">Social Media</p>
                      <div className="flex gap-2">
                        {Object.entries(profile.socialLinks).map(([platform, url]) => {
                          const Icon = socialIcons[platform as keyof typeof socialIcons];
                          return (
                            <a
                              key={platform}
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 rounded-lg bg-muted hover:bg-muted/80 transition-colors"
                              aria-label={`Visit ${platform}`}
                            >
                              <Icon className="h-4 w-4" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Mission & Programs */}
          {profile && profile.missionStatement && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <Target className="h-4 w-4" />
              Mission & Programs
            </h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                {profile.missionStatement && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Mission Statement</p>
                    <p className="text-base leading-relaxed">{profile.missionStatement}</p>
                  </div>
                )}

                {profile.programAreas && profile.programAreas.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-3">Program Areas</p>
                      <ul className="space-y-2">
                        {profile.programAreas.map((area, index) => (
                          <li key={index} className="flex items-start gap-2 text-sm">
                            <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                            <span>{area}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                {profile.regionsServed && profile.regionsServed.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground mb-2">Regions Served</p>
                      <div className="flex flex-wrap gap-2">
                        {profile.regionsServed.map((region, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            <MapPin className="h-3 w-3 mr-1" />
                            {region}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </section>
          )}

          {/* Impact & Track Record */}
          {profile && (profile.recentHighlights?.length > 0 || profile.impactMetrics?.length > 0 || profile.partnerships?.length > 0) && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Impact & Track Record
            </h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                {/* Recent Highlights */}
                {profile.recentHighlights && profile.recentHighlights.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Recent Highlights</p>
                    <ul className="space-y-2">
                      {profile.recentHighlights.map((highlight, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-1 flex-shrink-0">•</span>
                          <span className="leading-relaxed">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {profile.recentHighlights && profile.recentHighlights.length > 0 &&
                 profile.impactMetrics && profile.impactMetrics.length > 0 && (
                  <Separator />
                )}

                {/* Impact Metrics */}
                {profile.impactMetrics && profile.impactMetrics.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Key Impact Metrics</p>
                    <div className="grid grid-cols-2 gap-3">
                      {profile.impactMetrics.map((metric, index) => (
                        <div
                          key={index}
                          className="p-3 rounded-lg bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
                        >
                          <p className="text-2xl font-bold text-primary mb-1">{metric.value}</p>
                          <p className="text-xs text-muted-foreground">{metric.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {profile.impactMetrics && profile.impactMetrics.length > 0 &&
                 profile.partnerships && profile.partnerships.length > 0 && (
                  <Separator />
                )}

                {/* Partnerships */}
                {profile.partnerships && profile.partnerships.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-3">Notable Partnerships</p>
                    <ul className="space-y-2">
                      {profile.partnerships.map((partnership, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span>{partnership}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          </section>

          )}

          {/* Causes Supported */}
          {charity.causes && charity.causes.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Causes Supported
            </h3>
            <div className="flex flex-wrap gap-2">
              {charity.causes.map((cause) => (
                <Badge 
                  key={cause} 
                  variant="outline"
                  className="text-sm px-3 py-1.5"
                >
                  {getCauseLabel(cause)}
                </Badge>
              ))}
            </div>
          </section>
          )}

          {/* Action Button */}
          {onDonate && (
            <div className="pt-4 sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-t">
              <Button 
                onClick={() => {
                  onOpenChange(false);
                  onDonate();
                }}
                size="lg"
                className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
              >
                Support This Organization
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}