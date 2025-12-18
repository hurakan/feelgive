import { Charity } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Shield, CheckCircle2, Award, Info } from 'lucide-react';
import { getVettingLevelLabel } from '@/utils/charity-matching';
import { useState } from 'react';
import { OrganizationProfile } from './organization-profile';

interface CharityCardProps {
  charity: Charity;
  onDonate: (charity: Charity) => void;
  featured?: boolean;
  isSelected?: boolean;
}

export function CharityCard({ charity, onDonate, featured = false, isSelected = false }: CharityCardProps) {
  const [showProfile, setShowProfile] = useState(false);

  const getTrustColor = (score: number) => {
    if (score >= 95) return 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/30';
    if (score >= 90) return 'from-blue-500/20 to-blue-500/5 border-blue-500/30';
    return 'from-amber-500/20 to-amber-500/5 border-amber-500/30';
  };

  const getTrustBadgeColor = (score: number) => {
    if (score >= 95) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    if (score >= 90) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
    return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
  };

  return (
    <>
      <Card 
        className={`w-full transition-all duration-300 hover:shadow-xl hover:scale-[1.01] ${
          featured ? `border-2 shadow-lg bg-gradient-to-br ${getTrustColor(charity.trustScore)}` : 'border'
        } ${
          isSelected ? 'ring-4 ring-primary/30 border-primary shadow-xl' : ''
        }`}
        role="article"
        aria-label={`${charity.name} charity information`}
        aria-selected={isSelected}
      >
        <CardHeader className="pb-4">
          <div className="space-y-3">
            {/* Organization name with inline info icon */}
            <div className="flex items-center gap-2">
              <CardTitle className="text-xl leading-tight">{charity.name}</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowProfile(true)}
                      className="h-6 w-6 p-0 flex-shrink-0 hover:bg-primary/10"
                      aria-label={`View detailed profile for ${charity.name}`}
                    >
                      <Info className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" sideOffset={5}>
                    <p className="text-xs">View full profile</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>

            {/* Status badges */}
            {(featured || isSelected) && (
              <div className="flex items-center gap-2 flex-wrap">
                {featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-sm">
                    <Award className="h-3 w-3 mr-1" />
                    Best Match
                  </Badge>
                )}
                {isSelected && (
                  <Badge className="bg-gradient-to-r from-primary to-blue-500 text-white border-0 shadow-sm">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Your Choice
                  </Badge>
                )}
              </div>
            )}

            {/* Trust Score Badge and Vetting Level - no tooltips */}
            <div className="flex items-center justify-between">
              <Badge 
                variant="outline" 
                className={`font-semibold ${getTrustBadgeColor(charity.trustScore)}`}
              >
                <Shield className="h-3 w-3 mr-1" />
                {charity.trustScore}% Trust
              </Badge>

              {/* Vetting Level */}
              <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <div className={`w-2 h-2 rounded-full ${
                  charity.vettingLevel === 'pg_direct' ? 'bg-emerald-500' :
                  charity.vettingLevel === 'partner_pg_review' ? 'bg-blue-500' :
                  'bg-amber-500'
                }`} />
                {getVettingLevelLabel(charity.vettingLevel)}
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription className="text-sm leading-relaxed text-foreground/70">
            {charity.description}
          </CardDescription>

          {/* Single primary action button - reduced size */}
          <Button 
            onClick={() => onDonate(charity)} 
            className={`w-full h-9 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] ${
              isSelected 
                ? 'bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg' 
                : featured 
                  ? 'bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90' 
                  : ''
            }`}
            variant={isSelected || featured ? 'default' : 'outline'}
            aria-label={isSelected ? `Selected: ${charity.name}. Click to change selection` : `Select ${charity.name}`}
          >
            {isSelected ? 'Selected ✓' : 'Select This Organization'}
          </Button>
        </CardContent>
      </Card>

      <OrganizationProfile
        charity={charity}
        open={showProfile}
        onOpenChange={setShowProfile}
        onDonate={() => onDonate(charity)}
      />
    </>
  );
}