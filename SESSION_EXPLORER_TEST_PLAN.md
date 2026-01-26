# Session Explorer Test Plan & Fix Strategy

## Problem Statement
The Session Explorer in the Admin Analytics dashboard has three critical issues:
1. **Old article titles showing** - When expanding a session, it shows old article titles instead of the most recent ones
2. **Article titles not clickable** - Article titles should be hyperlinks but they're not clickable
3. **Same article repeated** - The same article appears multiple times instead of showing different articles

## Test Environment
- Frontend: http://localhost:5173
- Backend: http://localhost:3001
- Admin Dashboard: http://localhost:5173/admin-analytics (Ctrl+Shift+N)

## Testing Strategy

### Phase 1: Data Verification (Backend)
**Goal**: Verify that the backend is storing and returning correct data

**Tests**:
1. ✅ Verify article_opened events are being stored with articleUrl in metadata
2. ✅ Verify sessions are being updated with lastActivity timestamp
3. ✅ Verify /sessions endpoint returns sessions sorted by lastActivity
4. ✅ Verify /sessions/{id}/events endpoint returns all events with metadata

**Expected Results**:
- Each article_opened event should have `metadata.articleUrl`
- Sessions should be sorted by `lastActivity` (most recent first)
- Events should be returned in chronological order
- All metadata should be preserved

### Phase 2: Frontend Data Fetching
**Goal**: Verify that the frontend is fetching fresh data without caching

**Tests**:
1. ✅ Verify getSessions() uses cache-busting when bustCache=true
2. ✅ Verify getSessionEvents() uses cache-busting when bustCache=true
3. ✅ Verify toggleSessionExpansion() always passes bustCache=true
4. ✅ Verify loadSessions() clears expanded state when refreshing

**Expected Results**:
- API calls should include `?_t=timestamp` parameter
- Requests should have `cache: 'no-cache'` header
- Browser should receive 200 responses, not 304
- Expanded session state should be cleared on refresh

### Phase 3: Frontend Rendering
**Goal**: Verify that the frontend correctly renders the fetched data

**Tests**:
1. ❌ Verify article titles are rendered with correct eventName
2. ❌ Verify article titles are wrapped in <a> tags with href
3. ❌ Verify each article event shows a different title
4. ❌ Verify React re-renders when data changes

**Expected Results**:
- Article titles should match the eventName from the API
- Article titles should be clickable <a> tags
- Each article_opened event should show its unique title
- Component should re-render when expandedSessionDetails changes

## Root Cause Analysis

### Issue #1: Old Article Titles
**Hypothesis**: React is not re-rendering the component when new data arrives
**Possible Causes**:
- React key not forcing re-render
- State not being updated properly
- Component memoization preventing updates

### Issue #2: Not Clickable
**Hypothesis**: The conditional rendering logic is not working
**Possible Causes**:
- `event.metadata?.articleUrl` is undefined or null
- Conditional check is failing
- Link is being rendered but CSS is hiding it

### Issue #3: Same Article Repeated
**Hypothesis**: Events array is not being properly mapped
**Possible Causes**:
- Array is being filtered incorrectly
- Same event object is being reused
- Event IDs are not unique

## Fix Strategy

### Step 1: Add Comprehensive Logging
Add console.log statements to track:
- What data is received from API
- What data is stored in state
- What data is being rendered
- When components re-render

### Step 2: Verify Data Flow
1. Check API response in Network tab
2. Check state in React DevTools
3. Check rendered DOM in Elements tab
4. Compare all three to find where data is lost

### Step 3: Fix Rendering Logic
Based on findings, fix:
- Conditional rendering logic for article links
- React keys for proper re-rendering
- State updates to trigger re-renders

### Step 4: Verify Fixes
Run through complete user flow:
1. Read article A
2. Refresh dashboard
3. Expand session - should show article A with clickable link
4. Read article B
5. Refresh dashboard
6. Expand session - should show both A and B with clickable links

## Implementation Plan

### Immediate Actions
1. Add detailed console logging to admin-analytics.tsx
2. Add logging to analytics-client.ts
3. Create automated test script
4. Run diagnostic script to verify backend data
5. Inspect frontend rendering with browser DevTools

### Fixes to Implement
1. Ensure React keys include timestamp or event count
2. Verify conditional logic for article links
3. Add explicit state clearing before updates
4. Force component remount if necessary

### Verification
1. Run automated tests
2. Manual testing of complete flow
3. Check browser console for errors
4. Verify in multiple scenarios

## Success Criteria
- ✅ Backend returns correct data with articleUrl
- ✅ Frontend fetches fresh data without caching
- ✅ Article titles show the most recent articles
- ✅ Article titles are clickable hyperlinks
- ✅ Each article event shows a unique title
- ✅ System works consistently across multiple test cycles

## Next Steps
1. Run diagnostic script to verify backend data
2. Add comprehensive logging to frontend
3. Test and identify exact failure point
4. Implement targeted fixes
5. Verify fixes work correctly
6. Document solution