import { Donation, UserProfile, Classification } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, Home, History } from 'lucide-react';
import { getCauseLabel } from '@/utils/classification';
import { StorytellerAgent } from '@/utils/storyteller-agent';
import { ImpactStoryCard } from './impact-story-card';
import { getDonations, getTotalDonated } from '@/utils/donations';

interface DonationConfirmationProps {
  donation: Donation;
  classification?: Classification;
  onViewHistory: () => void;
  onNewDonation: () => void;
}

export function DonationConfirmation({ 
  donation,
  classification,
  onViewHistory, 
  onNewDonation 
}: DonationConfirmationProps) {
  // Generate user profile
  const allDonations = getDonations();
  const userProfile: UserProfile = {
    totalDonations: allDonations.length,
    totalAmount: getTotalDonated(),
    favoriteCauses: [donation.cause],
    donationFrequency: allDonations.length === 1 ? 'first-time' : 
                       allDonations.length < 5 ? 'occasional' : 
                       allDonations.length < 10 ? 'regular' : 'champion',
    averageDonation: getTotalDonated() / allDonations.length,
    monthlyDonations: allDonations.filter(d => {
      const date = new Date(d.timestamp);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).length,
  };

  // Generate personalized impact story with classification context
  const impactStory = StorytellerAgent.createImpactStory(donation, userProfile, classification);

  return (
    <div className="space-y-6 w-full">
      {/* Simple header */}
      <div className="text-center py-6">
        <h2 className="text-3xl font-bold mb-2">Thank You!</h2>
        <p className="text-lg text-muted-foreground">
          Your donation is making a real difference
        </p>
      </div>

      {/* Donation Details Card */}
      <Card className="w-full border-2 border-green-500/20 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl">Donation Confirmed</CardTitle>
          <CardDescription className="text-base">
            Your generosity is creating positive change
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Donation Details */}
          <div className="rounded-lg bg-background/80 backdrop-blur p-4 space-y-3 border-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Amount</span>
              <span className="text-3xl font-bold text-primary">${donation.amount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Organization</span>
              <span className="text-sm font-medium text-right max-w-[200px]">
                {donation.charityName}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cause</span>
              <span className="text-sm font-medium">
                {getCauseLabel(donation.cause)}
              </span>
            </div>
          </div>

          {/* Receipt Info */}
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Donation ID: {donation.id}</p>
            <p className="mt-1">
              In production, you'll receive a tax-deductible receipt via email
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personalized Impact Story */}
      <ImpactStoryCard 
        story={impactStory} 
        donationAmount={donation.amount}
      />

      {/* Action Buttons - smaller size */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <Button 
          variant="outline" 
          onClick={onViewHistory} 
          className="h-10"
        >
          <History className="mr-2 h-4 w-4" />
          My Impact
        </Button>
        <Button 
          onClick={onNewDonation} 
          className="h-10 bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90"
        >
          <Heart className="mr-2 h-4 w-4" />
          Give Again
        </Button>
      </div>
    </div>
  );
}