import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Heart } from 'lucide-react';
import { Charity } from '@/types';
import confetti from 'canvas-confetti';

// Harper's Index-style impact statistics
const IMPACT_STATS = [
  "Hours of clean water provided by a $10 donation: 240",
  "Meals served to families in crisis per $5 donated: 15",
  "Children vaccinated with a $25 donation: 8",
  "Emergency shelter nights funded by $20: 3",
  "School supplies provided per $15 donation: 30 students",
  "Percentage of donors who report increased happiness: 88%",
  "Days of medication provided by a $10 donation: 45",
  "Trees planted per $5 donation in reforestation efforts: 12",
  "Blankets distributed to refugees per $20 donation: 6",
  "Minutes it takes for your donation to reach those in need: 24",
  "Percentage of millennials who donate after seeing impact: 73%",
  "Emergency food packages delivered per $10 donation: 4",
  "Hours of counseling provided by a $25 donation: 2",
  "Textbooks provided to students per $15 donation: 5",
  "Liters of clean water purified per $5 donation: 500"
];

function getRandomImpactStat(): string {
  return IMPACT_STATS[Math.floor(Math.random() * IMPACT_STATS.length)];
}

interface MockDonationSuccessProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  charity: Charity;
  amount: number;
}

export function MockDonationSuccess({ open, onOpenChange, charity, amount }: MockDonationSuccessProps) {
  const [showConfetti, setShowConfetti] = useState(true);
  const [impactStat, setImpactStat] = useState('');

  useEffect(() => {
    if (open) {
      // Reset confetti state and select random impact stat
      setShowConfetti(true);
      setImpactStat(getRandomImpactStat());

      // Trigger confetti animation
      const duration = 4000; // Extended to 4 seconds
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      function randomInRange(min: number, max: number) {
        return Math.random() * (max - min) + min;
      }

      const interval = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          setShowConfetti(false);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      return () => {
        clearInterval(interval);
      };
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-gradient-to-br from-primary/10 to-blue-500/10 p-4">
              <Heart className="h-16 w-16 text-primary" fill="currentColor" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold">
            Thank You
          </DialogTitle>
          <DialogDescription className="text-base">
            ${amount} to {charity.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="bg-muted/30 rounded-lg p-6 border border-muted space-y-4">
            <p className="text-xs text-center text-muted-foreground/80 uppercase tracking-wide font-semibold">
              Did you know?
            </p>
            <p className="text-sm text-center text-muted-foreground leading-relaxed font-medium">
              {impactStat}
            </p>
            <p className="text-xs text-center text-muted-foreground/70 italic pt-2">
              Keep making a difference—every contribution creates real change.
            </p>
          </div>

          <div className="text-center pt-2">
            <Button
              onClick={() => onOpenChange(false)}
              size="lg"
              className="w-full h-12 text-base font-medium bg-gradient-to-r from-primary to-blue-500 hover:from-primary/90 hover:to-blue-500/90 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Continue
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}