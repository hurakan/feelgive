import { useState, useEffect } from 'react';
import { Charity, DonationFormData } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Heart, Mail, Info, HelpCircle, ExternalLink, AlertTriangle } from 'lucide-react';
import { canDonate, getUserPreferences } from '@/utils/donations';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  isEveryOrgEnabled,
  validateCharityForEveryOrg,
  validateDonationAmount,
  openEveryOrgDonation
} from '@/utils/every-org';

interface DonationFormProps {
  charity: Charity;
  onSubmit: (data: DonationFormData) => void;
  onCancel: () => void;
  isProcessing?: boolean;
}

const QUICK_AMOUNTS = [1, 2, 5, 10];

export function DonationForm({ charity, onSubmit, onCancel, isProcessing = false }: DonationFormProps) {
  const [amount, setAmount] = useState<number>(2);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [touched, setTouched] = useState({ amount: false, email: false });
  const [isRedirecting, setIsRedirecting] = useState(false);

  const everyOrgEnabled = isEveryOrgEnabled();
  const charityValidation = validateCharityForEveryOrg(charity);

  useEffect(() => {
    const prefs = getUserPreferences();
    if (prefs.email) {
      setEmail(prefs.email);
    }
  }, []);

  const handleQuickAmount = (value: number) => {
    setAmount(value);
    setCustomAmount('');
    setError('');
    setTouched({ ...touched, amount: true });
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    const parsed = parseFloat(value);
    if (!isNaN(parsed) && parsed > 0) {
      setAmount(parsed);
      setError('');
    } else if (value && touched.amount) {
      setError('Please enter a valid amount');
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (touched.email && value && !isValidEmail(value)) {
      setError('Please enter a valid email address');
    } else {
      setError('');
    }
  };

  const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalAmount = customAmount ? parseFloat(customAmount) : amount;
    
    // Validate amount
    const amountValidation = validateDonationAmount(finalAmount);
    if (!amountValidation.isValid) {
      setError(amountValidation.error || 'Invalid amount');
      return;
    }

    if (email && !isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    const check = canDonate(finalAmount);
    if (!check.allowed) {
      setError(check.reason || 'Unable to process donation');
      return;
    }

    // If Every.org is enabled, redirect to their platform
    if (everyOrgEnabled && charityValidation.isValid) {
      setIsRedirecting(true);
      
      try {
        openEveryOrgDonation({
          slug: charity.slug,
          amount: finalAmount,
          frequency: 'once',
          email: email.trim() || undefined,
        });

        // Give user feedback that they're being redirected
        setTimeout(() => {
          setIsRedirecting(false);
          // Call onSubmit to track the donation locally
          onSubmit({
            amount: finalAmount,
            email: email.trim() || undefined,
          });
        }, 1500);
      } catch (err) {
        setError('Unable to open donation page. Please try again.');
        setIsRedirecting(false);
      }
    } else {
      // Demo mode - use existing flow
      onSubmit({
        amount: finalAmount,
        email: email.trim() || undefined,
      });
    }
  };

  return (
    <Card className="w-full border-2">
      <CardHeader className="text-center pb-4">
        <CardTitle className="text-xl">Support {charity.name}</CardTitle>
        <CardDescription className="text-base mt-2">
          Choose your donation amount
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          {/* Quick Amount Buttons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base">Select Amount</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Why these amounts?"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      These suggested amounts are optimized for quick micro-donations. 
                      You can also enter any custom amount below.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div 
              className="grid grid-cols-4 gap-3"
              role="group"
              aria-label="Quick donation amounts"
            >
              {QUICK_AMOUNTS.map((value) => (
                <Button
                  key={value}
                  type="button"
                  variant={amount === value && !customAmount ? 'default' : 'outline'}
                  onClick={() => handleQuickAmount(value)}
                  disabled={isProcessing}
                  className="h-14 text-lg font-semibold transition-all duration-200 hover:scale-105 active:scale-95"
                  aria-pressed={amount === value && !customAmount}
                  aria-label={`Donate $${value}`}
                >
                  ${value}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom Amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount" className="text-base">
              Or Enter Your Amount
            </Label>
            <div className="relative">
              <span 
                className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-medium text-muted-foreground"
                aria-hidden="true"
              >
                $
              </span>
              <Input
                id="custom-amount"
                type="number"
                step="0.01"
                min="1"
                max="1000"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                onBlur={() => setTouched({ ...touched, amount: true })}
                className="pl-8 h-12 text-lg"
                disabled={isProcessing}
                aria-describedby="amount-hint"
                aria-invalid={!!error && touched.amount}
              />
            </div>
            <p id="amount-hint" className="text-xs text-muted-foreground">
              Minimum $1, maximum $1,000
            </p>
          </div>

          {/* Email (Optional) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="email" className="text-base">
                Email for Receipt (Optional)
              </Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="Why do we need your email?"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">
                      We'll send you a tax-deductible receipt and keep you updated on your impact. 
                      Your email is never shared with third parties.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                onBlur={() => setTouched({ ...touched, email: true })}
                className="pl-10 h-12"
                disabled={isProcessing}
                aria-describedby="email-hint"
                aria-invalid={!!error && touched.email && !!email}
              />
            </div>
            <p id="email-hint" className="text-xs text-muted-foreground">
              We'll remember this for next time
            </p>
          </div>

          {error && (
            <Alert variant="destructive" role="alert">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Status Alerts */}
          {!everyOrgEnabled && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Demo Mode: This is a simulation. Enable Every.org payments in settings to process real donations.
              </AlertDescription>
            </Alert>
          )}

          {everyOrgEnabled && charityValidation.warning && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {charityValidation.warning}
              </AlertDescription>
            </Alert>
          )}

          {everyOrgEnabled && charityValidation.isValid && (
            <Alert>
              <ExternalLink className="h-4 w-4" />
              <AlertDescription className="text-xs">
                You'll be securely redirected to Every.org to complete your donation.
              </AlertDescription>
            </Alert>
          )}

          {everyOrgEnabled && !charityValidation.isValid && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {charityValidation.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isProcessing}
              className="flex-1 h-12 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Back
            </Button>
            <Button
              type="submit"
              disabled={isProcessing || isRedirecting || !!error || (everyOrgEnabled && !charityValidation.isValid)}
              className="flex-1 h-12 text-base font-medium transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              {isRedirecting ? (
                <span className="flex items-center gap-2">
                  <span>Redirecting to Every.org...</span>
                </span>
              ) : isProcessing ? (
                <span>Processing...</span>
              ) : everyOrgEnabled && charityValidation.isValid ? (
                <span className="flex items-center gap-2">
                  <span>Donate ${customAmount || amount}</span>
                  <ExternalLink className="h-4 w-4" />
                </span>
              ) : (
                `Donate $${customAmount || amount}`
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}