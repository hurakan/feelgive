# Every.org Charity Validation Report

## Executive Summary

After testing the Every.org integration, I discovered several critical findings that affect your charity slug validation strategy.

## Key Findings

### ✅ What Works
1. **UNICEF USA** - Found and active on Every.org
   - Correct slug: `unicef-usa` (NOT `unicef`)
   - Page loads successfully
   - Donations accepted

### ❌ What Doesn't Work
1. **American Red Cross** - Found but NOT accepting donations
   - Page exists but shows: "We don't currently support donations to this nonprofit"
   - This is a major limitation

### 🔍 Discovery Process
- Every.org has security protections that block automated validation
- Manual browser testing is required
- Many major charities may not be available or have different slugs than expected

## Critical Insight: Not All Nonprofits Accept Donations on Every.org

**Important:** Even if a nonprofit has a profile page on Every.org, they may not accept donations through the platform. You'll see this message:

> "We don't currently support donations to this nonprofit. To request we add support email us."

## Recommended Strategy

### Option 1: Use Every.org's Verified Nonprofits (Recommended)

Instead of trying to match your existing charity list to Every.org, **start with nonprofits that are already verified and accepting donations on Every.org**.

**Benefits:**
- ✅ Guaranteed to work
- ✅ No slug validation needed
- ✅ Better user experience
- ✅ Faster implementation

**How to implement:**
1. Browse Every.org's categories (Disaster Relief, Health, etc.)
2. Select 10-15 top-rated nonprofits per category
3. Use their verified slugs
4. Update your [`charities.ts`](frontend/src/data/charities.ts) file

### Option 2: Manual Validation (Current Approach)

If you want to keep your existing charity list, you'll need to:

1. **Manually search each charity** on Every.org
2. **Verify they accept donations** (not just that they have a profile)
3. **Record the correct slug** (may differ from your current slugs)
4. **Update your data** with verified information

**Time estimate:** 30-60 minutes for 18 charities

### Option 3: Hybrid Approach (Best of Both Worlds)

1. **Keep high-priority verified charities** from Every.org
2. **Add your specific charities** that are verified to work
3. **Mark unverified charities** with a flag to show "Direct donation link" instead

## Validation Results So Far

| Charity | Current Slug | Status | Correct Slug | Notes |
|---------|-------------|--------|--------------|-------|
| UNICEF | `unicef` | ❌ Not Found | `unicef-usa` | Found as "UNICEF USA" |
| American Red Cross | `american-red-cross` | ⚠️ No Donations | `american-red-cross` | Profile exists but donations not supported |
| International Red Cross | `red-cross` | ❓ Not Tested | TBD | Need to search |
| Doctors Without Borders | `doctors-without-borders` | ❓ Not Tested | TBD | Need to search |
| Direct Relief | `direct-relief` | ❓ Not Tested | TBD | Need to search |
| ... | ... | ... | ... | 14 more to test |

## Next Steps

### Immediate Actions

1. **Decision Point:** Choose your strategy (Option 1, 2, or 3)

2. **If Option 1 (Recommended):**
   ```bash
   # I can help you:
   # 1. Browse Every.org categories
   # 2. Extract verified nonprofit data
   # 3. Generate updated charities.ts file
   ```

3. **If Option 2 (Manual Validation):**
   ```bash
   # You'll need to:
   # 1. Visit https://www.every.org
   # 2. Search each charity name
   # 3. Check if donations are accepted
   # 4. Record the slug from the URL
   # 5. Update charities.ts manually
   ```

4. **If Option 3 (Hybrid):**
   ```bash
   # I can help you:
   # 1. Get verified charities from Every.org
   # 2. Test your priority charities
   # 3. Create a mixed dataset
   ```

## Technical Implementation

### Current Integration Status
- ✅ Frontend utilities built ([`every-org.ts`](frontend/src/utils/every-org.ts))
- ✅ Feature flag system ready
- ✅ URL generation working
- ✅ Validation logic in place
- ❌ Charity slugs need verification
- ❌ Not all charities available on Every.org

### What You Can Do Right Now

**Test with UNICEF USA:**
```typescript
// In your code, update:
{
  id: 'hc-002',
  name: 'UNICEF USA',
  slug: 'unicef-usa',  // ← Updated slug
  everyOrgVerified: true,  // ← Mark as verified
  // ... rest of fields
}
```

Then enable the feature flag:
```bash
# frontend/.env
VITE_ENABLE_EVERY_ORG_PAYMENTS=true
```

Test a donation to verify the flow works!

## Alternative: Contact Every.org

If many of your charities aren't available, consider:

**Email:** partners@every.org or hello@every.org

**Subject:** "Partnership Request - Crisis Response Donation Platform"

**Ask about:**
- Adding specific nonprofits to their platform
- Bulk nonprofit verification
- API access for nonprofit search
- Partnership opportunities

## Conclusion

**The Reality:**
- Every.org doesn't have all nonprofits
- Not all listed nonprofits accept donations
- Manual verification is currently required
- This is normal for donation platforms

**The Solution:**
- Start with verified Every.org nonprofits (fastest)
- Or manually validate your existing list (slower)
- Or use a hybrid approach (balanced)

**My Recommendation:**
Use Option 1 (Every.org's verified nonprofits) to launch quickly, then gradually add your specific charities as you verify them.

---

## Ready to Proceed?

Let me know which option you'd like to pursue, and I'll help you:
1. Extract verified nonprofits from Every.org
2. Complete manual validation for your list
3. Build a hybrid dataset
4. Or explore alternative donation platforms