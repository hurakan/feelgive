# Every.org Dynamic Integration Summary

## Overview

FeelGive now features a **dynamic integration** with Every.org's Partners API, providing real-time access to thousands of verified nonprofit organizations. This replaces the previous hardcoded charity data approach with a scalable, maintainable solution.

## Key Features

✅ **Dynamic Organization Fetching** - Real-time data from Every.org's API  
✅ **Backend API Service** - Centralized API integration with caching  
✅ **Frontend React Hook** - Easy-to-use `useOrganizations` hook with automatic caching  
✅ **Search Functionality** - Search organizations by name, category, or keywords  
✅ **Fallback System** - Graceful degradation to hardcoded data if API fails  
✅ **Staging Environment** - Full testing support with staging.every.org  
✅ **Donation URL Generation** - Automatic URL creation with redirect support  
✅ **Type Safety** - Full TypeScript support throughout the stack  

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│  ┌────────────────────────────────────────────────────┐    │
│  │  useOrganizations Hook                              │    │
│  │  - Fetches from backend API                         │    │
│  │  - Caches results                                   │    │
│  │  - Falls back to hardcoded data                     │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTP Request
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Express)                       │
│  ┌────────────────────────────────────────────────────┐    │
│  │  /api/v1/organizations/search                       │    │
│  │  /api/v1/organizations/:slug                        │    │
│  │                                                      │    │
│  │  EveryOrgService                                    │    │
│  │  - Calls Every.org Partners API                     │    │
│  │  - Transforms response data                         │    │
│  │  - Handles errors gracefully                        │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                            ↓ HTTPS Request
┌─────────────────────────────────────────────────────────────┐
│              Every.org Partners API                          │
│         https://partners.every.org/v0.2                      │
│                                                               │
│  - Returns verified nonprofit data                           │
│  - Includes logos, descriptions, EINs                        │
│  - Real-time updates                                         │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### Backend Components

#### 1. Every.org Service (`backend/src/services/every-org.ts`)

```typescript
class EveryOrgService {
  // Search organizations
  async searchOrganizations(searchTerm?: string): Promise<EveryOrgNonprofit[]>
  
  // Get specific organization
  async getOrganizationBySlug(slug: string): Promise<EveryOrgNonprofit | null>
}
```

**Features:**
- Axios-based HTTP client
- 10-second timeout
- Comprehensive error handling
- Response transformation
- Singleton pattern

#### 2. API Routes (`backend/src/routes/organizations.ts`)

**Endpoints:**
- `GET /api/v1/organizations/search?q={term}` - Search organizations
- `GET /api/v1/organizations/:slug` - Get organization by slug

**Features:**
- Express validator for input validation
- Swagger documentation
- Error handling middleware
- RESTful design

### Frontend Components

#### 1. useOrganizations Hook (`frontend/src/hooks/use-organizations.tsx`)

```typescript
function useOrganizations(searchTerm?: string): UseOrganizationsResult {
  organizations: Charity[];
  loading: boolean;
  error: string | null;
  refetch: (searchTerm?: string) => Promise<void>;
}
```

**Features:**
- Automatic caching by search term
- Loading and error states
- Fallback to hardcoded data
- Refetch capability
- TypeScript support

#### 2. Every.org Utilities (`frontend/src/utils/every-org.ts`)

```typescript
// Generate donation URL with redirect
generateEveryOrgUrl(params: EveryOrgDonationParams): string

// Validate charity for donation
validateCharityForEveryOrg(charity: Charity): EveryOrgValidationResult

// Open donation page
openEveryOrgDonation(params: EveryOrgDonationParams): Window | null
```

## Configuration Guide

### Backend Setup

1. **Install Dependencies** (already done):
   ```bash
   cd backend
   npm install axios
   ```

2. **Configure Environment Variables**:
   ```env
   # backend/.env
   EVERY_ORG_API_PUBLIC_KEY=your-api-key-here
   DONATION_URL=staging.every.org  # or www.every.org for production
   REDIRECT_URL=http://localhost:5173/donation-success
   ```

3. **Get API Key**:
   - Visit [Every.org Partners](https://www.every.org/partners)
   - Sign up for a partner account
   - Generate API key from dashboard

### Frontend Setup

1. **Configure Environment Variables**:
   ```env
   # frontend/.env
   VITE_API_BASE_URL=http://localhost:3001/api/v1
   VITE_ENABLE_BACKEND=true
   VITE_DONATION_BASE_URL=staging.every.org
   VITE_REDIRECT_URL=http://localhost:5173/donation-success
   VITE_ENABLE_EVERY_ORG_PAYMENTS=true  # Enable real donations
   ```

2. **Update Components**:
   ```typescript
   // Replace hardcoded imports
   import { useOrganizations } from '@/hooks/use-organizations';
   
   function MyComponent() {
     const { organizations, loading, error } = useOrganizations();
     // Use organizations array
   }
   ```

## Usage Examples

### Search All Organizations

```typescript
const { organizations, loading, error } = useOrganizations();

if (loading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;

return (
  <div>
    {organizations.map(org => (
      <OrganizationCard key={org.id} organization={org} />
    ))}
  </div>
);
```

### Search Specific Organizations

```typescript
const { organizations } = useOrganizations('disaster relief');
// Returns organizations matching "disaster relief"
```

### Get Single Organization

```typescript
import { useOrganization } from '@/hooks/use-organizations';

const { organization, loading, error } = useOrganization('american-red-cross');
```

### Generate Donation URL

```typescript
import { generateEveryOrgUrl } from '@/utils/every-org';

const url = generateEveryOrgUrl({
  slug: 'american-red-cross',
  amount: 25,
  frequency: 'once',
  email: 'donor@example.com'
});
// Returns: https://staging.every.org/american-red-cross?amount=25&frequency=ONCE&redirect=...
```

## Testing

### Backend API Testing

```bash
# Test search endpoint
curl http://localhost:3001/api/v1/organizations/search?q=red+cross

# Test specific organization
curl http://localhost:3001/api/v1/organizations/american-red-cross

# Test without search term (returns all)
curl http://localhost:3001/api/v1/organizations/search
```

### Frontend Testing

1. **Test Dynamic Fetching**:
   - Start backend: `cd backend && npm run dev`
   - Start frontend: `cd frontend && npm run dev`
   - Visit http://localhost:5173
   - Organizations should load from API

2. **Test Fallback**:
   - Stop backend server
   - Frontend should automatically fall back to hardcoded data
   - No errors should appear

3. **Test Search**:
   - Use search functionality in UI
   - Results should filter dynamically

### Staging Environment Testing

```env
# Use staging.every.org for testing
DONATION_URL=staging.every.org
VITE_DONATION_BASE_URL=staging.every.org
```

Benefits:
- Test donations without real money
- Verify URL generation
- Test redirect flow
- Validate organization data

## Migration from Hardcoded Data

### Before (Hardcoded)

```typescript
import { CHARITIES } from '@/data/charities';

function CharityList() {
  const charities = CHARITIES;
  return <div>{/* render charities */}</div>;
}
```

### After (Dynamic)

```typescript
import { useOrganizations } from '@/hooks/use-organizations';

function CharityList() {
  const { organizations, loading, error } = useOrganizations();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  
  return <div>{/* render organizations */}</div>;
}
```

### Backward Compatibility

The hardcoded data in `frontend/src/data/charities-verified.ts` is maintained as:
- **Fallback** when API is unavailable
- **Reference** for testing
- **Offline support** during development

## Troubleshooting

### Common Issues

#### 1. "Every.org API key is not configured"

**Solution:**
```bash
# Add to backend/.env
EVERY_ORG_API_PUBLIC_KEY=your-api-key
```

#### 2. Organizations not loading

**Check:**
- Backend server is running (`npm run dev` in backend/)
- `VITE_ENABLE_BACKEND=true` in frontend/.env
- `VITE_API_BASE_URL` points to correct backend URL
- Network tab shows successful API calls

**Fallback:**
- App should automatically use hardcoded data
- Check console for error messages

#### 3. Donation redirect not working

**Check:**
- `REDIRECT_URL` in backend/.env matches your frontend URL
- `VITE_REDIRECT_URL` in frontend/.env is correct
- Pop-up blocker is disabled
- Using correct donation base URL (staging vs production)

#### 4. CORS errors

**Solution:**
```env
# backend/.env
FRONTEND_URL=http://localhost:5173
```

### Debug Mode

Enable detailed logging:

```typescript
// Backend
console.log('Fetching organizations from Every.org:', searchTerm);

// Frontend
console.log('Organizations loaded:', organizations.length);
console.log('Cache status:', cache.size);
```

## Performance Considerations

### Caching Strategy

**Frontend Cache:**
- Caches results by search term
- Reduces unnecessary API calls
- Improves user experience
- Automatic cache invalidation on refetch

**Backend:**
- No persistent cache (stateless)
- Consider adding Redis for production
- Rate limiting prevents abuse

### Optimization Tips

1. **Lazy Loading**: Load organizations on demand
2. **Pagination**: Implement for large result sets
3. **Debouncing**: Debounce search input
4. **Prefetching**: Prefetch popular organizations

## Security

### API Key Protection

- ✅ API key stored in backend environment variables
- ✅ Never exposed to frontend
- ✅ Backend acts as proxy
- ✅ Rate limiting on backend endpoints

### Donation Security

- ✅ Opens Every.org in new tab with `noopener,noreferrer`
- ✅ All parameters properly URL encoded
- ✅ No sensitive data passed except optional email
- ✅ Source tracking with `source=feelgive`

## Production Deployment

### Checklist

- [ ] Obtain production Every.org API key
- [ ] Update `DONATION_URL=www.every.org`
- [ ] Update `REDIRECT_URL` to production domain
- [ ] Set `VITE_DONATION_BASE_URL=www.every.org`
- [ ] Set `VITE_REDIRECT_URL` to production domain
- [ ] Enable `VITE_ENABLE_EVERY_ORG_PAYMENTS=true`
- [ ] Test donation flow end-to-end
- [ ] Monitor API usage and errors
- [ ] Set up error tracking (Sentry, etc.)

### Environment Variables

**Backend Production:**
```env
EVERY_ORG_API_PUBLIC_KEY=prod-api-key
DONATION_URL=www.every.org
REDIRECT_URL=https://yourdomain.com/donation-success
```

**Frontend Production:**
```env
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_ENABLE_BACKEND=true
VITE_DONATION_BASE_URL=www.every.org
VITE_REDIRECT_URL=https://yourdomain.com/donation-success
VITE_ENABLE_EVERY_ORG_PAYMENTS=true
```

## Related Documentation

- [Frontend Integration Guide](frontend/EVERY_ORG_INTEGRATION.md) - Detailed frontend documentation
- [Backend README](backend/README.md) - Backend API documentation
- [Backend Integration Guide](BACKEND_INTEGRATION.md) - Full stack integration
- [Charity Verification Guide](frontend/CHARITY_SLUG_VERIFICATION_GUIDE.md) - Legacy verification process
- [Test Report](EVERY_ORG_DYNAMIC_INTEGRATION_TEST_REPORT.md) - Comprehensive test results

## Support

### Resources

- **Every.org Partners**: https://www.every.org/partners
- **Every.org API Docs**: https://www.every.org/nonprofits
- **GitHub Issues**: Report integration issues

### Contact

For integration questions or issues:
1. Check this documentation
2. Review related documentation files
3. Check console logs for errors
4. Open GitHub issue with details

## Future Enhancements

- [ ] Add Redis caching for backend
- [ ] Implement pagination for large result sets
- [ ] Add organization categories/filtering
- [ ] Support for recurring donations
- [ ] Webhook integration for donation confirmation
- [ ] Advanced search with filters (location, category, etc.)
- [ ] Organization recommendations based on user history
- [ ] A/B testing framework for donation flows

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Status**: Production Ready (Staging Tested)