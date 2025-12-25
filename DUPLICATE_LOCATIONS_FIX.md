# Duplicate Locations Fix

## Issue
The news feed was showing "News from Africa" twice (or other locations appearing multiple times) on the landing page.

## Root Cause
The `saveTrackedLocation()` function in [`frontend/src/utils/tracked-locations.ts`](frontend/src/utils/tracked-locations.ts:53) was not checking for duplicates before adding locations to localStorage. This allowed the same location to be saved multiple times.

## Solution

### 1. Prevention (Code Fix)
Updated the `saveTrackedLocation()` function to check for duplicates before adding a location:

```typescript
export function saveTrackedLocation(location: TrackedLocation): void {
  const locations = getTrackedLocations();
  
  // Check if location already exists (prevent duplicates)
  const isDuplicate = locations.some(loc => {
    // For cities, check value, state, and country
    if (location.type === 'city' && loc.type === 'city') {
      return loc.value === location.value &&
             loc.state === location.state &&
             loc.country === location.country;
    }
    // For regions and countries, check value and type
    return loc.value === location.value && loc.type === location.type;
  });
  
  if (isDuplicate) {
    console.warn('Location already tracked:', location.displayName);
    return;
  }
  
  locations.push(location);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(locations));
}
```

This ensures that:
- For **cities**: Duplicates are detected by matching `value`, `state`, and `country`
- For **regions/countries**: Duplicates are detected by matching `value` and `type`

### 2. Cleanup (For Existing Users)
To remove existing duplicates from localStorage, users can run the cleanup script:

**Option A: Browser Console**
1. Open the browser console (F12 or Cmd+Option+I)
2. Copy and paste the contents of [`frontend/fix-duplicate-locations.js`](frontend/fix-duplicate-locations.js)
3. Press Enter to run it
4. Refresh the page

**Option B: Settings Modal**
1. Open Settings (⚙️ icon)
2. Remove duplicate locations manually
3. Click "Accept Changes"

## Testing
After applying the fix:
1. Try adding the same location twice - it should be prevented
2. Check the browser console for the warning: "Location already tracked: [location name]"
3. Verify that the news feed only shows each location once

## Files Modified
- [`frontend/src/utils/tracked-locations.ts`](frontend/src/utils/tracked-locations.ts) - Added duplicate prevention
- [`frontend/fix-duplicate-locations.js`](frontend/fix-duplicate-locations.js) - Cleanup script for existing duplicates