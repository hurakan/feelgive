import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MapPin, X, Plus, Loader2 } from 'lucide-react';
import { TrackedLocation, LocationType } from '@/types';
import { 
  getTrackedLocations, 
  saveTrackedLocation, 
  removeTrackedLocation,
  generateLocationId,
  isLocationAlreadyTracked,
  REGIONS,
  COUNTRIES
} from '@/utils/tracked-locations';
import { geocodePostalCode, isValidPostalCode } from '@/utils/geocoding';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationsChanged: () => void;
}

// Countries that support postal codes
const POSTAL_CODE_COUNTRIES = [
  { code: 'US', name: 'United States' },
  { code: 'CA', name: 'Canada' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'AU', name: 'Australia' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'BE', name: 'Belgium' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'AT', name: 'Austria' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'FI', name: 'Finland' },
  { code: 'PL', name: 'Poland' },
  { code: 'CZ', name: 'Czech Republic' },
  { code: 'PT', name: 'Portugal' },
  { code: 'IE', name: 'Ireland' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'JP', name: 'Japan' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SG', name: 'Singapore' },
  { code: 'IN', name: 'India' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'AR', name: 'Argentina' },
  { code: 'ZA', name: 'South Africa' },
];

export function SettingsModal({ open, onOpenChange, onLocationsChanged }: SettingsModalProps) {
  const [locations, setLocations] = useState<TrackedLocation[]>(getTrackedLocations());
  const [locationType, setLocationType] = useState<LocationType>('country');
  const [locationValue, setLocationValue] = useState('');
  const [postalCountry, setPostalCountry] = useState('US'); // Default to US
  const [isAdding, setIsAdding] = useState(false);

  const handleAddLocation = async () => {
    if (!locationValue.trim()) {
      toast.error('Please enter a location');
      return;
    }

    // For postal codes, check with country code
    const checkValue = locationType === 'postal_code' 
      ? `${locationValue}-${postalCountry}` 
      : locationValue;

    if (isLocationAlreadyTracked(checkValue)) {
      toast.error('This location is already being tracked');
      return;
    }

    setIsAdding(true);

    try {
      let newLocation: TrackedLocation;

      if (locationType === 'postal_code') {
        if (!isValidPostalCode(locationValue)) {
          toast.error('Invalid postal code format');
          setIsAdding(false);
          return;
        }

        const geocoded = await geocodePostalCode(locationValue, postalCountry);
        
        if (!geocoded) {
          toast.error(`Could not find postal code "${locationValue}" in ${POSTAL_CODE_COUNTRIES.find(c => c.code === postalCountry)?.name}`);
          setIsAdding(false);
          return;
        }

        newLocation = {
          id: generateLocationId(),
          type: 'postal_code',
          value: `${locationValue}-${postalCountry}`, // Store with country code to avoid duplicates
          displayName: `${locationValue} (${geocoded.displayName})`,
          coordinates: {
            lat: geocoded.lat,
            lng: geocoded.lng
          },
          createdAt: Date.now()
        };
      } else {
        newLocation = {
          id: generateLocationId(),
          type: locationType,
          value: locationValue.trim(),
          displayName: locationValue.trim(),
          createdAt: Date.now()
        };
      }

      saveTrackedLocation(newLocation);
      setLocations(getTrackedLocations());
      setLocationValue('');
      setPostalCountry('US'); // Reset to default
      onLocationsChanged();
      toast.success(`Now tracking ${newLocation.displayName}`);
    } catch (error) {
      toast.error('Failed to add location');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveLocation = (id: string, displayName: string) => {
    console.log('Removing location:', id, displayName);
    
    try {
      removeTrackedLocation(id);
      const updatedLocations = getTrackedLocations();
      setLocations(updatedLocations);
      onLocationsChanged();
      toast.success(`Removed ${displayName}`);
    } catch (error) {
      console.error('Error removing location:', error);
      toast.error('Failed to remove location');
    }
  };

  const getLocationTypeLabel = (type: LocationType): string => {
    const labels = {
      region: 'Region',
      country: 'Country',
      postal_code: 'Postal Code'
    };
    return labels[type];
  };

  const getPostalCodePlaceholder = (): string => {
    const examples: { [key: string]: string } = {
      'US': '90210',
      'CA': 'M5H 2N2',
      'GB': 'SW1A 1AA',
      'AU': '2000',
      'DE': '10115',
      'FR': '75001',
      'IT': '00100',
      'ES': '28001',
      'NL': '1012',
      'BE': '1000',
      'CH': '8001',
      'AT': '1010',
      'SE': '111 22',
      'NO': '0001',
      'DK': '1050',
      'FI': '00100',
      'PL': '00-001',
      'CZ': '110 00',
      'PT': '1000-001',
      'IE': 'D01',
      'NZ': '1010',
      'JP': '100-0001',
      'KR': '03000',
      'SG': '018956',
      'IN': '110001',
      'BR': '01310-100',
      'MX': '01000',
      'AR': 'C1000',
      'ZA': '0001',
    };
    return examples[postalCountry] || '12345';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Track news from specific regions, countries, or postal codes
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-6">
          {/* Add Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Add Location to Track
            </h3>
            
            <div className="space-y-3">
              {/* Location Type Selector */}
              <div>
                <Label htmlFor="location-type">Location Type</Label>
                <Select value={locationType} onValueChange={(v) => setLocationType(v as LocationType)}>
                  <SelectTrigger id="location-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="postal_code">Postal Code</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Value Input */}
              {locationType === 'region' ? (
                <div>
                  <Label htmlFor="location-value">Region Name</Label>
                  <Select value={locationValue} onValueChange={setLocationValue}>
                    <SelectTrigger id="location-value">
                      <SelectValue placeholder="Select a region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIONS.map(region => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : locationType === 'country' ? (
                <div>
                  <Label htmlFor="location-value">Country Name</Label>
                  <Select value={locationValue} onValueChange={setLocationValue}>
                    <SelectTrigger id="location-value">
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  {/* Country Selector for Postal Code */}
                  <div>
                    <Label htmlFor="postal-country">Country</Label>
                    <Select value={postalCountry} onValueChange={setPostalCountry}>
                      <SelectTrigger id="postal-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {POSTAL_CODE_COUNTRIES.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Postal Code Input */}
                  <div>
                    <Label htmlFor="location-value">Postal/Zip Code</Label>
                    <Input
                      id="location-value"
                      placeholder={`e.g., ${getPostalCodePlaceholder()}`}
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      disabled={isAdding}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Format varies by country. Example for {POSTAL_CODE_COUNTRIES.find(c => c.code === postalCountry)?.name}: {getPostalCodePlaceholder()}
                    </p>
                  </div>
                </>
              )}
            </div>

            <Button 
              onClick={handleAddLocation} 
              disabled={!locationValue || isAdding}
              className="w-full"
            >
              {isAdding ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Location
                </>
              )}
            </Button>

            {locationType === 'postal_code' && (
              <p className="text-xs text-muted-foreground">
                News will be fetched within a 200-mile radius of this postal code
              </p>
            )}
          </div>

          <Separator />

          {/* Tracked Locations List */}
          <div className="flex-1 overflow-hidden flex flex-col">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              Tracked Locations ({locations.length})
            </h3>
            
            {locations.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div className="space-y-2">
                  <MapPin className="h-12 w-12 mx-auto text-muted-foreground/50" />
                  <p className="text-sm text-muted-foreground">
                    No locations tracked yet. Add one above to get started.
                  </p>
                </div>
              </div>
            ) : (
              <ScrollArea className="flex-1 -mx-6 px-6">
                <div className="space-y-2 pb-4">
                  {locations.map(location => (
                    <div
                      key={location.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <MapPin className="h-4 w-4 text-primary flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{location.displayName}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {getLocationTypeLabel(location.type)}
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveLocation(location.id, location.displayName);
                        }}
                        className="flex-shrink-0 h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${location.displayName}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}