/**
 * Fix Duplicate Locations Script
 * 
 * Run this in the browser console to remove duplicate tracked locations.
 * This will clean up any duplicates that may have been created before the fix.
 * 
 * Usage:
 * 1. Open the browser console (F12 or Cmd+Option+I)
 * 2. Copy and paste this entire script
 * 3. Press Enter to run it
 * 4. Refresh the page to see the changes
 */

(function fixDuplicateLocations() {
  const STORAGE_KEY = 'feelgive_tracked_locations';
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    if (!stored) {
      console.log('✅ No tracked locations found');
      return;
    }
    
    const locations = JSON.parse(stored);
    console.log(`📊 Found ${locations.length} tracked locations`);
    
    // Remove duplicates
    const uniqueLocations = [];
    const seen = new Set();
    
    for (const loc of locations) {
      // Create a unique key based on location type
      let key;
      if (loc.type === 'city') {
        key = `city:${loc.value}:${loc.state || ''}:${loc.country}`;
      } else {
        key = `${loc.type}:${loc.value}`;
      }
      
      if (!seen.has(key)) {
        seen.add(key);
        uniqueLocations.push(loc);
      } else {
        console.log(`🗑️  Removing duplicate: ${loc.displayName}`);
      }
    }
    
    const removedCount = locations.length - uniqueLocations.length;
    
    if (removedCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(uniqueLocations));
      console.log(`✅ Removed ${removedCount} duplicate location(s)`);
      console.log(`📊 Now tracking ${uniqueLocations.length} unique locations:`);
      uniqueLocations.forEach((loc, idx) => {
        console.log(`   ${idx + 1}. ${loc.displayName} (${loc.type})`);
      });
      console.log('\n🔄 Please refresh the page to see the changes');
    } else {
      console.log('✅ No duplicates found - all locations are unique!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing duplicates:', error);
  }
})();