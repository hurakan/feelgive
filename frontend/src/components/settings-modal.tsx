import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { MapPin, X, Plus, Loader2, Newspaper, Flag, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NewsAPIAdmin } from '@/components/news-api-admin';
import { TrackedLocation, LocationType } from '@/types';
import {
  getTrackedLocations,
  saveTrackedLocation,
  removeTrackedLocation,
  generateLocationId,
  isLocationAlreadyTracked,
  REGIONS,
  COUNTRIES,
  COUNTRIES_WITH_STATES,
  getStatesForCountry
} from '@/utils/tracked-locations';
import { geocodeCity, isValidCity } from '@/utils/geocoding';
import { getFeatureFlags, saveFeatureFlags, FeatureFlags } from '@/utils/feature-flags';
import { toast } from 'sonner';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationsChanged: () => void;
}


export function SettingsModal({ open, onOpenChange, onLocationsChanged }: SettingsModalProps) {
  const navigate = useNavigate();
  
  // Track original locations to detect changes
  const [originalLocations, setOriginalLocations] = useState<TrackedLocation[]>(getTrackedLocations());
  const [locations, setLocations] = useState<TrackedLocation[]>(getTrackedLocations());
  const [locationType, setLocationType] = useState<LocationType>('country');
  const [locationValue, setLocationValue] = useState('');
  const [cityCountry, setCityCountry] = useState('US'); // Default to US
  const [cityState, setCityState] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [showNewsAPITab, setShowNewsAPITab] = useState(false);
  const [showFeatureFlagsTab, setShowFeatureFlagsTab] = useState(false);
  const [showAnalyticsTab, setShowAnalyticsTab] = useState(false);
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags>(getFeatureFlags());

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      const currentLocations = getTrackedLocations();
      setOriginalLocations(currentLocations);
      setLocations(currentLocations);
      setLocationValue('');
      setCityCountry('US');
      setCityState('');
      setAvailableStates(getStatesForCountry('US'));
      setHasChanges(false);
      setShowNewsAPITab(false); // Reset tab visibility when modal opens
      setShowFeatureFlagsTab(false); // Reset feature flags tab visibility
      setShowAnalyticsTab(false); // Reset analytics tab visibility
      setFeatureFlags(getFeatureFlags()); // Reload feature flags
    }
  }, [open]);

  // Listen for secret key combinations
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+Shift+N (or Cmd+Shift+N on Mac) - Toggle News API tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'N') {
        e.preventDefault();
        setShowNewsAPITab(prev => !prev);
        if (!showNewsAPITab) {
          toast.success('News API tab unlocked');
        } else {
          toast.info('News API tab hidden');
        }
      }
      
      // Ctrl+Shift+F (or Cmd+Shift+F on Mac) - Toggle Feature Flags tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'F') {
        e.preventDefault();
        setShowFeatureFlagsTab(prev => !prev);
        if (!showFeatureFlagsTab) {
          toast.success('Feature Flags tab unlocked');
        } else {
          toast.info('Feature Flags tab hidden');
        }
      }
      
      // Ctrl+Shift+A (or Cmd+Shift+A on Mac) - Toggle Analytics tab
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'A') {
        e.preventDefault();
        setShowAnalyticsTab(prev => !prev);
        if (!showAnalyticsTab) {
          toast.success('Analytics tab unlocked');
        } else {
          toast.info('Analytics tab hidden');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, showNewsAPITab, showFeatureFlagsTab, showAnalyticsTab]);

  // Check if there are unsaved changes
  useEffect(() => {
    const changed = JSON.stringify(locations) !== JSON.stringify(originalLocations);
    setHasChanges(changed);
  }, [locations, originalLocations]);

  // Update available states when country changes
  useEffect(() => {
    if (locationType === 'city') {
      const states = getStatesForCountry(cityCountry);
      setAvailableStates(states);
      // Reset state selection if country changed
      if (states.length > 0 && !states.includes(cityState)) {
        setCityState('');
      }
    }
  }, [cityCountry, locationType]);

  const handleAddLocation = async () => {
    if (!locationValue.trim()) {
      toast.error('Please enter a location');
      return;
    }

    // For cities, check with state and country
    const checkValue = locationType === 'city'
      ? `${locationValue}-${cityState}-${cityCountry}`
      : locationValue;

    // Check if location already exists in current state
    const alreadyExists = locations.some(loc => {
      if (locationType === 'city') {
        return loc.value === locationValue.trim() &&
               loc.state === cityState &&
               loc.country === cityCountry;
      }
      return loc.value === locationValue.trim() && loc.type === locationType;
    });

    if (alreadyExists) {
      toast.error('This location is already in your list');
      return;
    }

    setIsAdding(true);

    try {
      let newLocation: TrackedLocation;

      if (locationType === 'city') {
        if (!isValidCity(locationValue)) {
          toast.error('Invalid city name');
          setIsAdding(false);
          return;
        }

        // Validate state is selected for countries that require it
        if (availableStates.length > 0 && !cityState) {
          toast.error('Please select a state');
          setIsAdding(false);
          return;
        }

        const geocoded = await geocodeCity(locationValue, cityState, cityCountry);
        
        if (!geocoded) {
          const locationDesc = cityState
            ? `${locationValue}, ${cityState}`
            : locationValue;
          const countryName = COUNTRIES_WITH_STATES.find(c => c.code === cityCountry)?.name || cityCountry;
          toast.error(`Could not find city "${locationDesc}" in ${countryName}`);
          setIsAdding(false);
          return;
        }

        const displayParts = [locationValue];
        if (cityState) displayParts.push(cityState);
        const countryName = COUNTRIES_WITH_STATES.find(c => c.code === cityCountry)?.name || cityCountry;
        displayParts.push(countryName);

        newLocation = {
          id: generateLocationId(),
          type: 'city',
          value: locationValue.trim(),
          state: cityState || undefined,
          country: cityCountry,
          displayName: displayParts.join(', '),
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

      // Add to local state (not saved yet)
      setLocations([...locations, newLocation]);
      setLocationValue('');
      setCityCountry('US'); // Reset to default
      setCityState('');
      toast.success(`Added ${newLocation.displayName} (not saved yet)`);
    } catch (error) {
      toast.error('Failed to add location');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveLocation = (id: string) => {
    const locationToRemove = locations.find(loc => loc.id === id);
    
    // Remove from local state (not saved yet)
    const updatedLocations = locations.filter(loc => loc.id !== id);
    setLocations(updatedLocations);
    
    if (locationToRemove) {
      toast.info(`Removed ${locationToRemove.displayName} (not saved yet)`);
    }
  };

  const handleAccept = () => {
    try {
      // Save locations
      localStorage.setItem('feelgive_tracked_locations', JSON.stringify(locations));
      
      // Save feature flags
      saveFeatureFlags(featureFlags);
      
      // Update original locations to match current
      setOriginalLocations(locations);
      setHasChanges(false);
      
      // Notify parent component
      onLocationsChanged();
      
      toast.success('Settings saved successfully');
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      // Revert to original locations
      setLocations(originalLocations);
      setHasChanges(false);
      toast.info('Changes discarded');
    }
    onOpenChange(false);
  };

  const getLocationTypeLabel = (type: LocationType): string => {
    const labels = {
      region: 'Region',
      country: 'Country',
      city: 'City'
    };
    return labels[type];
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl">Settings</DialogTitle>
          <DialogDescription>
            Manage your news tracking and API sources
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="locations" className="flex-1 overflow-hidden flex flex-col">
          <TabsList className={`grid w-full ${
            [showNewsAPITab, showFeatureFlagsTab, showAnalyticsTab].filter(Boolean).length === 3 ? 'grid-cols-4' :
            [showNewsAPITab, showFeatureFlagsTab, showAnalyticsTab].filter(Boolean).length === 2 ? 'grid-cols-3' :
            [showNewsAPITab, showFeatureFlagsTab, showAnalyticsTab].filter(Boolean).length === 1 ? 'grid-cols-2' :
            'grid-cols-1'
          }`}>
            <TabsTrigger value="locations" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Tracked Locations
            </TabsTrigger>
            {showNewsAPITab && (
              <TabsTrigger value="news-api" className="flex items-center gap-2">
                <Newspaper className="h-4 w-4" />
                News API
              </TabsTrigger>
            )}
            {showFeatureFlagsTab && (
              <TabsTrigger value="feature-flags" className="flex items-center gap-2">
                <Flag className="h-4 w-4" />
                Feature Flags
              </TabsTrigger>
            )}
            {showAnalyticsTab && (
              <TabsTrigger value="analytics" className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="locations" className="flex-1 overflow-hidden flex flex-col gap-6 mt-4">
          {/* Add Location Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Add Location to Track
            </h3>
            
            <div className="space-y-3">
              {/* Location Type Selector */}
              <div>
                <Label htmlFor="location-type">Location Type</Label>
                <Select
                  value={locationType}
                  onValueChange={(v) => {
                    setLocationType(v as LocationType);
                    setLocationValue(''); // Reset value when type changes
                  }}
                >
                  <SelectTrigger id="location-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent position="popper" sideOffset={5}>
                    <SelectItem value="region">Region</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                    <SelectItem value="city">City</SelectItem>
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
                    <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
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
                    <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                      {COUNTRIES.map(country => (
                        <SelectItem key={country} value={country}>{country}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <>
                  {/* Country Selector for City */}
                  <div>
                    <Label htmlFor="city-country">Country</Label>
                    <Select value={cityCountry} onValueChange={setCityCountry}>
                      <SelectTrigger id="city-country">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                        {COUNTRIES_WITH_STATES.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* State Selector (if country has states) */}
                  {availableStates.length > 0 && (
                    <div>
                      <Label htmlFor="city-state">State/Province</Label>
                      <Select value={cityState} onValueChange={setCityState}>
                        <SelectTrigger id="city-state">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                        <SelectContent position="popper" sideOffset={5} className="max-h-[300px]">
                          {availableStates.map(state => (
                            <SelectItem key={state} value={state}>
                              {state}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* City Input */}
                  <div>
                    <Label htmlFor="location-value">City Name</Label>
                    <Input
                      id="location-value"
                      placeholder="e.g., Los Angeles"
                      value={locationValue}
                      onChange={(e) => setLocationValue(e.target.value)}
                      disabled={isAdding}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Enter the city name. {availableStates.length > 0 ? 'State selection is required.' : ''}
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

            {locationType === 'city' && (
              <p className="text-xs text-muted-foreground">
                News will be fetched within a 100-mile radius of this city
              </p>
            )}
          </div>

          <Separator />

          {/* Tracked Locations List */}
          <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3 flex-shrink-0">
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
              <div className="h-[300px] overflow-hidden">
                <ScrollArea className="h-full w-full">
                  <div className="space-y-2 pr-4">
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
                          handleRemoveLocation(location.id);
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
              </div>
            )}
          </div>
          </TabsContent>

          {showNewsAPITab && (
            <TabsContent value="news-api" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="flex-1 overflow-auto">
                <NewsAPIAdmin />
              </div>
            </TabsContent>
          )}

          {showFeatureFlagsTab && (
            <TabsContent value="feature-flags" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="space-y-6">
                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <p className="text-sm text-amber-900 dark:text-amber-100">
                    <strong>⚠️ Developer Settings:</strong> These flags control experimental features and integrations.
                    Changes take effect immediately but may affect app functionality.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Payment Integration
                  </h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-1 flex-1">
                      <Label htmlFor="every-org-payment" className="text-base font-medium cursor-pointer">
                        Enable Every.org Payment Integration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, clicking "Donate" redirects to Every.org staging environment.
                        When disabled (default), shows a mock success message instead.
                      </p>
                    </div>
                    <Switch
                      id="every-org-payment"
                      checked={featureFlags.enableEveryOrgPayment}
                      onCheckedChange={(checked) => {
                        setFeatureFlags({ ...featureFlags, enableEveryOrgPayment: checked });
                        setHasChanges(true);
                      }}
                    />
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>How to access this tab:</strong></p>
                  <p>Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Shift+F</kbd> (or <kbd className="px-2 py-1 bg-muted rounded">Cmd+Shift+F</kbd> on Mac) while in Settings</p>
                </div>
              </div>
            </TabsContent>
          )}

          {showAnalyticsTab && (
            <TabsContent value="analytics" className="flex-1 overflow-hidden flex flex-col mt-4">
              <div className="space-y-6">
                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>📊 Admin Analytics:</strong> Access the full analytics dashboard to view detailed metrics, trends, and conversion funnels.
                  </p>
                </div>

                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    Dashboard Access
                  </h3>
                  
                  <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                    <div className="space-y-1 flex-1">
                      <Label className="text-base font-medium">
                        Open Analytics Dashboard
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        View comprehensive analytics including user metrics, page views, sessions, and conversion funnels.
                      </p>
                    </div>
                    <Button
                      onClick={() => {
                        onOpenChange(false);
                        navigate('/admin/analytics');
                      }}
                      className="ml-4"
                    >
                      <BarChart3 className="mr-2 h-4 w-4" />
                      Open Dashboard
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>How to access this tab:</strong></p>
                  <p>Press <kbd className="px-2 py-1 bg-muted rounded">Ctrl+Shift+A</kbd> (or <kbd className="px-2 py-1 bg-muted rounded">Cmd+Shift+A</kbd> on Mac) while in Settings</p>
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>

        <DialogFooter className="gap-2 mt-4">
          <Button
            variant="outline"
            onClick={handleCancel}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAccept}
            disabled={!hasChanges}
          >
            Accept Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}