# Every.org Integration Documentation

## Overview

FeelGive integrates with Every.org to process real charitable donations. The integration now features **dynamic organization fetching** from Every.org's API, replacing the previous hardcoded charity data. This provides real-time access to thousands of verified nonprofits with automatic updates.

## Current Status

### ✅ Completed
- **Dynamic Organization Fetching**: Backend API endpoints to fetch organizations from Every.org
- **Backend Service**: [`EveryOrgService`](../backend/src/services/every-org.ts) for API integration
- **Frontend Hook**: [`useOrganizations`](./src/hooks/use-organizations.tsx) for data fetching with caching
- **API Endpoints**: `/api/v1/organizations/search` and `/api/v1/organizations/:slug`
- **Feature Flag System**: `VITE_ENABLE_EVERY_ORG_PAYMENTS` environment variable
- **Type System**: Added `everyOrgVerified` field to `Charity` interface
- **Utility Module**: Created [`utils/every-org.ts`](./src/utils/every-org.ts) with URL generation and validation
- **UI Integration**: Updated [`DonationForm`](./src/components/donation-form.tsx) component with:
  - Conditional rendering based on feature flag
  - Smooth "Redirecting..." loading state
  - Clear status alerts for different modes
  - External link indicator when Every.org is enabled
  - Consistent FeelGive branding throughout
- **Staging Environment Testing**: Comprehensive testing with staging.every.org
- **Fallback System**: Graceful fallback to hardcoded data if API fails

### ⚠️ Pending
- **Production API Key**: Need production Every.org API key for live deployment
- **Production Testing**: Feature flag is OFF by default for safe testing

## Architecture

### Dynamic Organization Fetching

The integration now uses a **backend-to-Every.org** architecture:

```
Frontend (React)
    ↓ (uses useOrganizations hook)
Backend API (/api/v1/organizations)
    ↓ (calls Every.org Partners API)
Every.org API (partners.every.org/v0.2)
    ↓ (returns nonprofit data)
Backend (transforms & caches)
    ↓ (returns to frontend)
Frontend (displays organizations)
```

**Key Components:**
1. **Backend Service**: [`EveryOrgService`](../backend/src/services/every-org.ts) - Handles API calls to Every.org
2. **Backend Routes**: [`/api/v1/organizations`](../backend/src/routes/organizations.ts) - RESTful endpoints
3. **Frontend Hook**: [`useOrganizations`](./src/hooks/use-organizations.tsx) - React hook with caching
4. **Frontend Utils**: [`every-org.ts`](./src/utils/every-org.ts) - URL generation and validation

### Feature Flag
```env
# .env or .env.local
VITE_ENABLE_EVERY_ORG_PAYMENTS=false  # Default: false (Demo Mode)
```

**Demo Mode (false)**:
- Donations are simulated
- No external redirects
- Data saved to localStorage only
- Alert shows: "Demo Mode: This is a simulation..."

**Production Mode (true)**:
- Real donations via Every.org
- Opens Every.org in new tab
- Validates charity slugs
- Alert shows: "You'll be securely redirected to Every.org..."

### Environment Configuration

**Staging (Testing)**:
```env
# Backend .env
EVERY_ORG_API_PUBLIC_KEY=your-api-key
DONATION_URL=staging.every.org
REDIRECT_URL=http://localhost:5173/donation-success

# Frontend .env
VITE_DONATION_BASE_URL=staging.every.org
VITE_REDIRECT_URL=http://localhost:5173/donation-success
VITE_ENABLE_EVERY_ORG_PAYMENTS=true
```

**Production**:
```env
# Backend .env
EVERY_ORG_API_PUBLIC_KEY=your-production-api-key
DONATION_URL=www.every.org
REDIRECT_URL=https://yourdomain.com/donation-success

# Frontend .env
VITE_DONATION_BASE_URL=www.every.org
VITE_REDIRECT_URL=https://yourdomain.com/donation-success
VITE_ENABLE_EVERY_ORG_PAYMENTS=true
```

### Validation Layers

1. **Charity Validation** (`validateCharityForEveryOrg`)
   - Checks if charity has a slug
   - Verifies charity is active
   - Warns if slug hasn't been verified (`everyOrgVerified: false`)

2. **Amount Validation** (`validateDonationAmount`)
   - Minimum: $1
   - Maximum: $10,000
   - Must be a valid number

3. **Monthly Cap** (existing feature)
   - User-configurable spending limit
   - Checked before processing

### Backend API Endpoints

#### Search Organizations
```
GET /api/v1/organizations/search?q={searchTerm}
```

**Parameters:**
- `q` (optional): Search term (returns all organizations if omitted)

**Response:**
```json
{
  "success": true,
  "count": 150,
  "organizations": [
    {
      "slug": "american-red-cross",
      "name": "American Red Cross",
      "description": "Prevents and alleviates human suffering...",
      "logoUrl": "https://...",
      "websiteUrl": "https://...",
      "ein": "53-0196605",
      "locationAddress": "Washington, DC",
      "primaryCategory": "Human Services",
      "nteeCode": "P20",
      "nteeCodeMeaning": "Human Service Organizations"
    }
  ]
}
```

#### Get Organization by Slug
```
GET /api/v1/organizations/{slug}
```

**Response:**
```json
{
  "success": true,
  "organization": {
    "slug": "american-red-cross",
    "name": "American Red Cross",
    ...
  }
}
```

### Frontend Hook Usage

```typescript
import { useOrganizations } from '@/hooks/use-organizations';

function MyComponent() {
  const { organizations, loading, error, refetch } = useOrganizations();
  
  // Search for specific organizations
  const { organizations: searchResults } = useOrganizations('disaster relief');
  
  // Refetch with new search term
  await refetch('medical aid');
  
  return (
    <div>
      {loading && <p>Loading organizations...</p>}
      {error && <p>Error: {error}</p>}
      {organizations.map(org => (
        <div key={org.id}>{org.name}</div>
      ))}
    </div>
  );
}
```

**Features:**
- Automatic caching to reduce API calls
- Fallback to hardcoded data if API fails
- Loading and error states
- Search functionality
- Refetch capability

### URL Generation

Every.org donation URLs are generated with the following format:
```
https://{baseUrl}/{slug}?amount={dollars}&frequency={ONCE|MONTHLY}&redirect={url}&source=feelgive#/donate/paypal/confirm
```

**Parameters**:
- `slug`: Charity identifier (e.g., "american-red-cross")
- `amount`: Donation amount in dollars (e.g., 25 for $25)
- `frequency`: "ONCE" or "MONTHLY" (uppercase)
- `redirect`: URL to redirect after donation completion
- `email`: Optional user email for receipt
- `source`: Tracking parameter set to "feelgive"
- `#/donate/paypal/confirm`: Hash fragment for PayPal flow

**Example:**
```
https://staging.every.org/american-red-cross?amount=25&frequency=ONCE&redirect=http://localhost:5173/donation-success&source=feelgive#/donate/paypal/confirm
```

## User Experience Flow

### Demo Mode Flow
1. User selects charity and amount
2. Clicks "Donate $X"
3. Sees success modal with impact story
4. Donation logged locally

### Every.org Mode Flow
1. User selects charity and amount
2. Sees alert: "You'll be securely redirected to Every.org"
3. Clicks "Donate $X 🔗" (with external link icon)
4. Button shows "Redirecting to Every.org..." with spinner
5. New tab opens to Every.org donation page
6. After 1.5s, donation logged locally for tracking
7. User completes payment on Every.org

## Migration from Hardcoded to Dynamic Data

### Overview
The integration has been upgraded from hardcoded charity data to dynamic fetching from Every.org's API. This provides:
- Real-time access to thousands of verified nonprofits
- Automatic updates when organizations change
- No manual slug verification needed
- Better search and discovery

### Migration Steps

**1. Backend Setup**
```bash
# Add to backend/.env
EVERY_ORG_API_PUBLIC_KEY=your-api-key
DONATION_URL=staging.every.org  # or www.every.org for production
REDIRECT_URL=http://localhost:5173/donation-success
```

**2. Frontend Configuration**
```bash
# Add to frontend/.env
VITE_DONATION_BASE_URL=staging.every.org
VITE_REDIRECT_URL=http://localhost:5173/donation-success
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_ENABLE_BACKEND=true
```

**3. Update Components**
Replace hardcoded charity imports with the `useOrganizations` hook:

```typescript
// Before (hardcoded)
import { CHARITIES } from '@/data/charities';

function MyComponent() {
  const charities = CHARITIES;
  // ...
}

// After (dynamic)
import { useOrganizations } from '@/hooks/use-organizations';

function MyComponent() {
  const { organizations, loading, error } = useOrganizations();
  // ...
}
```

**4. Fallback Behavior**
The system automatically falls back to hardcoded data if:
- Backend API is unavailable
- Every.org API fails
- Network issues occur

This ensures the app remains functional even during API outages.

### Backward Compatibility

The hardcoded charity data in [`data/charities-verified.ts`](./src/data/charities-verified.ts) is maintained as:
- Fallback data when API fails
- Reference for testing
- Offline development support

### Testing the Migration

1. **Test Dynamic Fetching:**
   ```bash
   # Start backend
   cd backend && npm run dev
   
   # Start frontend
   cd frontend && npm run dev
   
   # Visit http://localhost:5173
   # Organizations should load from API
   ```

2. **Test Fallback:**
   ```bash
   # Stop backend
   # Frontend should fall back to hardcoded data
   ```

3. **Test Search:**
   ```typescript
   const { organizations } = useOrganizations('disaster relief');
   // Should return filtered results from Every.org
   ```

## Charity Slug Verification

### Dynamic Slugs
With dynamic fetching, slugs are automatically verified by Every.org's API. All organizations returned have:
- Valid, working slugs
- Verified nonprofit status
- Up-to-date information
- Automatic `everyOrgVerified: true` flag

### Manual Verification (Legacy)
For the fallback hardcoded data in [`data/charities-verified.ts`](./src/data/charities-verified.ts):

1. Visit `https://staging.every.org/{slug}` for testing
2. Verify the page loads and shows the correct organization
3. Update the charity object with `everyOrgVerified: true`

**Note:** With dynamic fetching enabled, manual verification is no longer required for primary operations.

## Testing Checklist

### Before Enabling in Production

- [ ] Verify at least 5 high-priority charity slugs
- [ ] Test with different donation amounts ($1, $5, $25, $100)
- [ ] Test with and without email provided
- [ ] Verify pop-up blocker handling
- [ ] Test on mobile devices
- [ ] Verify monthly cap still works
- [ ] Check analytics/tracking integration
- [ ] Test error scenarios (invalid slug, blocked pop-up)

### Test Scenarios

1. **Happy Path**
   ```
   1. Enable flag: VITE_ENABLE_EVERY_ORG_PAYMENTS=true
   2. Select verified charity
   3. Enter $5 donation
   4. Provide email
   5. Click donate
   6. Verify redirect to Every.org
   7. Complete donation on Every.org
   ```

2. **Unverified Charity**
   ```
   1. Select charity with everyOrgVerified: false
   2. See warning: "This charity link has not been fully verified"
   3. Donation still proceeds (with warning)
   ```

3. **Invalid Charity**
   ```
   1. Charity with no slug
   2. See error: "This charity does not have an Every.org identifier"
   3. Donate button disabled
   ```

4. **Pop-up Blocked**
   ```
   1. Block pop-ups in browser
   2. Try to donate
   3. See error: "Pop-up blocked. Please allow pop-ups..."
   ```

## Code References

### Key Files

**Backend:**
- **Service**: [`backend/src/services/every-org.ts`](../backend/src/services/every-org.ts) - Every.org API integration
- **Routes**: [`backend/src/routes/organizations.ts`](../backend/src/routes/organizations.ts) - API endpoints
- **Config**: [`backend/.env.example`](../backend/.env.example) - Environment variables

**Frontend:**
- **Hook**: [`frontend/src/hooks/use-organizations.tsx`](./src/hooks/use-organizations.tsx) - React hook for fetching
- **Utilities**: [`frontend/src/utils/every-org.ts`](./src/utils/every-org.ts) - URL generation and validation
- **UI Component**: [`frontend/src/components/donation-form.tsx`](./src/components/donation-form.tsx) - Donation form
- **Types**: [`frontend/src/types/index.ts`](./src/types/index.ts) - TypeScript interfaces
- **Fallback Data**: [`frontend/src/data/charities-verified.ts`](./src/data/charities-verified.ts) - Hardcoded fallback

### Key Functions

**Backend:**
```typescript
// Search organizations from Every.org
everyOrgService.searchOrganizations(searchTerm?: string): Promise<EveryOrgNonprofit[]>

// Get specific organization by slug
everyOrgService.getOrganizationBySlug(slug: string): Promise<EveryOrgNonprofit | null>
```

**Frontend:**
```typescript
// Fetch organizations with caching
useOrganizations(searchTerm?: string): UseOrganizationsResult

// Fetch specific organization
useOrganization(slug: string): { organization, loading, error }

// Check if feature is enabled
isEveryOrgEnabled(): boolean

// Validate charity for donation
validateCharityForEveryOrg(charity: Charity): EveryOrgValidationResult

// Validate donation amount
validateDonationAmount(amount: number): EveryOrgValidationResult

// Generate Every.org URL with redirect
generateEveryOrgUrl(params: EveryOrgDonationParams): string

// Open donation page in new tab
openEveryOrgDonation(params: EveryOrgDonationParams): Window | null
```

## Security Considerations

1. **Pop-up Security**: Opens with `noopener,noreferrer` to prevent tab-nabbing
2. **URL Validation**: All parameters are properly encoded
3. **Amount Validation**: Server-side validation on Every.org
4. **No Sensitive Data**: Only email (optional) is passed to Every.org
5. **Source Tracking**: `source=feelgive` parameter for attribution

## Monitoring & Analytics

### Recommended Tracking
- Conversion rate (Demo vs Every.org mode)
- Failed redirects (pop-up blocks)
- Unverified charity warnings shown
- Average donation amounts by mode
- Charity slug verification status

### Error Logging
All errors are logged to console with context:
```javascript
console.warn('Failed to open Every.org donation window...')
```

## Rollout Strategy

### Phase 1: Internal Testing (Current)
- Feature flag OFF by default
- Test with verified charities only
- Monitor for issues

### Phase 2: Beta Testing
- Enable for select users
- Verify 10-15 top charities
- Collect feedback

### Phase 3: Production Rollout
- Enable for all users
- Monitor conversion rates
- Continue verifying charity slugs

## Support & Troubleshooting

### Common Issues

**Issue**: "Pop-up blocked" error
**Solution**: Instruct users to allow pop-ups for the site

**Issue**: Charity page not found on Every.org
**Solution**: Update slug in `charities.ts` and set `everyOrgVerified: false`

**Issue**: Donation not tracking locally
**Solution**: Check `onSubmit` callback in `DonationForm`

### Contact
For Every.org API questions: https://www.every.org/nonprofits
For FeelGive integration issues: Check GitHub issues

## Future Enhancements

- [ ] Add recurring donation support (`frequency: 'monthly'`)
- [ ] Implement webhook for donation confirmation
- [ ] Add charity search/autocomplete from Every.org API
- [ ] Support for custom donation designations
- [ ] Integration with Every.org's nonprofit verification API
- [ ] A/B testing framework for donation flows