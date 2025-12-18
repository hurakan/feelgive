# Charity Slug Verification Guide

## ⏰ REMINDER: Manual Verification Required

Before enabling Every.org payments in production, you must verify that each charity's slug correctly links to their Every.org page.

## Quick Verification Example

### Step-by-Step Process

**Example: Verifying "International Red Cross"**

1. **Find the charity in the data file:**
   ```typescript
   // In frontend/src/data/charities.ts
   {
     id: 'dr-001',
     name: 'International Red Cross',
     slug: 'red-cross',  // ← This is what we need to verify
     everyOrgVerified: undefined,  // ← Currently unverified
     // ... other fields
   }
   ```

2. **Visit the Every.org page:**
   - Open: `https://www.every.org/red-cross`
   - Check if the page loads successfully
   - Verify it shows the correct organization

3. **Update the charity data:**
   ```typescript
   {
     id: 'dr-001',
     name: 'International Red Cross',
     slug: 'red-cross',
     everyOrgVerified: true,  // ← Set to true after verification
     // ... other fields
   }
   ```

## Common Slug Issues & Fixes

### Issue 1: Page Not Found (404)
**Problem:** `https://www.every.org/red-cross` returns 404

**Solution:** Try variations:
- `american-red-cross`
- `international-red-cross`
- `icrc` (International Committee of the Red Cross)

**Fix in code:**
```typescript
slug: 'american-red-cross',  // Updated slug
everyOrgVerified: true,
```

### Issue 2: Wrong Organization
**Problem:** Page loads but shows different organization

**Solution:** Search Every.org for the correct organization name and use that slug

### Issue 3: Multiple Entities
**Problem:** Organization has multiple Every.org pages (e.g., "UNICEF" vs "UNICEF USA")

**Solution:** Choose the most appropriate entity:
- For US-focused: Use "unicef-usa"
- For international: Use "unicef"

## Priority Verification List

Verify these high-trust charities first:

### Tier 1 (Highest Priority - Trust Score 95%+)
- [ ] UNHCR (`unhcr`)
- [ ] Doctors Without Borders (`doctors-without-borders`)
- [ ] International Red Cross (`red-cross`)
- [ ] World Food Programme (`world-food-programme`)
- [ ] UNICEF (`unicef`)

### Tier 2 (High Priority - Trust Score 90-94%)
- [ ] International Rescue Committee (`international-rescue-committee`)
- [ ] Save the Children (`save-the-children`)
- [ ] Direct Relief (`direct-relief`)
- [ ] Partners In Health (`partners-in-health`)
- [ ] The Nature Conservancy (`nature-conservancy`)

### Tier 3 (Standard Priority - Trust Score 85-89%)
- [ ] Habitat for Humanity (`habitat-humanity`)
- [ ] American Red Cross (`american-red-cross`)
- [ ] Amnesty International (`amnesty-international`)
- [ ] Ocean Conservancy (`ocean-conservancy`)
- [ ] Oxfam International (`oxfam`)

### Tier 4 (Immigration Rights - Regional Focus)
- [ ] RAICES (`raices`)
- [ ] Al Otro Lado (`al-otro-lado`)
- [ ] United We Dream (`united-we-dream`)

## Verification Checklist Template

For each charity, complete this checklist:

```
Charity: [Name]
Current Slug: [slug]
Every.org URL: https://www.every.org/[slug]

[ ] Page loads successfully
[ ] Organization name matches
[ ] Mission statement aligns
[ ] Logo/branding looks correct
[ ] Accepts donations
[ ] Updated everyOrgVerified to true

Notes: [Any issues or alternative slugs tried]
```

## Example Verification Session

```typescript
// Before verification
{
  id: 'hc-001',
  name: 'Doctors Without Borders',
  slug: 'doctors-without-borders',
  everyOrgVerified: undefined,
}

// After visiting https://www.every.org/doctors-without-borders
// ✅ Page loads, shows correct org

// Updated code:
{
  id: 'hc-001',
  name: 'Doctors Without Borders',
  slug: 'doctors-without-borders',
  everyOrgVerified: true,  // ← VERIFIED
}
```

## Batch Verification Script (Optional)

You can create a simple script to test all URLs:

```javascript
// test-charity-slugs.js
const charities = [
  { name: 'UNHCR', slug: 'unhcr' },
  { name: 'Doctors Without Borders', slug: 'doctors-without-borders' },
  // ... add all charities
];

charities.forEach(async (charity) => {
  const url = `https://www.every.org/${charity.slug}`;
  try {
    const response = await fetch(url);
    console.log(`${charity.name}: ${response.status === 200 ? '✅' : '❌'} (${response.status})`);
  } catch (error) {
    console.log(`${charity.name}: ❌ Error`);
  }
});
```

## After Verification

Once you've verified charities:

1. **Commit the changes:**
   ```bash
   git add frontend/src/data/charities.ts
   git commit -m "Verify Every.org slugs for [charity names]"
   ```

2. **Enable the feature flag for testing:**
   ```bash
   # In frontend/.env.local
   VITE_ENABLE_EVERY_ORG_PAYMENTS=true
   ```

3. **Test the donation flow:**
   - Select a verified charity
   - Enter donation amount
   - Click "Donate" button
   - Verify redirect to Every.org
   - Check that the correct charity page loads

4. **Monitor for issues:**
   - Check browser console for errors
   - Verify pop-up isn't blocked
   - Confirm URL parameters are correct

## Need Help?

- **Every.org Search:** https://www.every.org/search
- **Every.org Nonprofits:** https://www.every.org/nonprofits
- **Documentation:** See `EVERY_ORG_INTEGRATION.md` for full details

## Estimated Time

- **Per charity:** 2-3 minutes
- **All 24 charities:** ~1 hour
- **Priority 10 charities:** ~20-30 minutes

Start with the high-priority charities and verify others as needed!