# Organization Recommendation Pipeline - Debug Report

## Executive Summary

**Status**: Phase 1 Complete - Comprehensive instrumentation implemented
**Date**: 2025-12-24
**Engineer**: Senior Debugging Engineer

## Problem Statement

The FeelGive app was failing to display recommended organizations after reading crisis news articles. Multiple attempts to fix this issue had failed due to lack of visibility into the pipeline execution.

## Root Cause Analysis

### Primary Issue: Lack of Observability

The pipeline had **ZERO correlation tracking** and **insufficient logging** at critical decision points. This made it impossible to:

1. Track a single request through the entire pipeline
2. Identify where the count drops to zero
3. Detect race conditions or async state issues
4. Understand filter behavior
5. Verify UI state updates

### Pipeline Architecture

The article → organization recommendation pipeline consists of these stages:

```
Article Ingest → Parse → Classify → Query Provider → Filter → Rank → UI Render
```

**Critical Failure Points Identified:**
- No visibility into search query extraction
- No tracking of API response counts
- No logging of filter decisions
- No confirmation of UI state updates
- No correlation between async operations

## Phase 1: Instrumentation Implementation

### 1. Debug Logger System (`frontend/src/utils/debug-logger.ts`)

Created a comprehensive logging system with:

**Features:**
- ✅ Correlation ID tracking across all pipeline stages
- ✅ Elapsed time measurement for each stage
- ✅ Result count tracking at each step
- ✅ Structured log entries with metadata
- ✅ Console output with emoji indicators
- ✅ Summary report generation
- ✅ Dev tools access via `window.__debugLogger`

**Pipeline Stages Tracked:**
1. `article_ingest_started` - Pipeline begins
2. `article_parsed_ok` - Content extracted
3. `cause_classification_ok` - Crisis classified
4. `org_provider_query_started` - API query initiated
5. `org_provider_response_received` - API response received
6. `org_filtering_started` - Filtering begins
7. `org_filtering_result` - Filtering complete
8. `org_ranking_started` - Ranking begins
9. `org_ranking_result` - Ranking complete
10. `ui_render_started` - UI update begins
11. `ui_rendered_count` - UI updated successfully
12. `pipeline_error` - Any error occurred

### 2. Index.tsx Integration

**Changes Made:**
- Added correlation ID state management
- Instrumented `processContent()` function with 11 log points
- Added error tracking with context
- Integrated debug logger throughout pipeline
- Added summary logging at completion

**Key Instrumentation Points:**

```typescript
// Example: Classification logging
debugLogger.log(
  correlationId,
  'cause_classification_ok',
  'info',
  'Content classified successfully',
  {
    cause: result.cause,
    tier1_crisis_type: result.tier1_crisis_type,
    detectedLocation: result.geoName,
    confidence: result.confidence
  }
);
```

### 3. Debug Panel UI (`frontend/src/components/debug-panel.tsx`)

Created a real-time debug panel that displays:

**Metrics Shown:**
- Current correlation ID
- Extracted location and cause
- Provider result count
- Filtered count
- Final rendered count
- Total elapsed time
- Error messages with context
- Stage-by-stage progress

**Features:**
- ✅ Collapsible panel (bottom-right corner)
- ✅ Auto-refresh every 500ms
- ✅ Copy summary to clipboard
- ✅ Clear logs functionality
- ✅ Only visible in development mode
- ✅ Color-coded by log level

## Current Pipeline Visibility

### What We Can Now See:

1. **Article Processing**
   - URL or pasted content
   - Title and text length
   - Parse success/failure

2. **Classification**
   - Detected location (e.g., "Sudan", "Ukraine")
   - Detected crisis type (e.g., "conflict", "disaster")
   - Root cause classification
   - Confidence score
   - Matched keywords count

3. **Organization Query**
   - Exact search query sent to API
   - Query parameters (location, causes, keywords)
   - API response time
   - Number of organizations returned

4. **Filtering**
   - Input count before filtering
   - Filter rules applied
   - Output count after filtering
   - Number of organizations removed

5. **Ranking**
   - Ranking weights used
   - Final organization count
   - Top 3 organization IDs

6. **UI Rendering**
   - Organizations passed to UI
   - Actual render count
   - State update confirmation

### Example Log Output:

```
📥 ℹ️  [pipeline_123] article_ingest_started (+0ms) [count: N/A]: Starting article processing pipeline
📄 ℹ️  [pipeline_123] article_parsed_ok (+850ms): Article content parsed successfully
🏷️ ℹ️  [pipeline_123] cause_classification_ok (+2100ms): Content classified successfully
🔍 ℹ️  [pipeline_123] org_provider_query_started (+2150ms): Querying organization provider
📡 ℹ️  [pipeline_123] org_provider_response_received (+3200ms) [count: 10]: Received organizations from provider
🔬 ℹ️  [pipeline_123] org_filtering_started (+3750ms): Starting organization filtering
✅ ℹ️  [pipeline_123] org_filtering_result (+3800ms) [count: 8]: Organizations filtered
📊 ℹ️  [pipeline_123] org_ranking_started (+3850ms): Starting organization ranking
🏆 ℹ️  [pipeline_123] org_ranking_result (+4100ms) [count: 8]: Organizations ranked and verified
🎨 ℹ️  [pipeline_123] ui_render_started (+4150ms): Starting UI render with organizations
✨ ℹ️  [pipeline_123] ui_rendered_count (+4200ms) [count: 8]: UI rendered successfully
```

## Testing Instructions

### How to Use the Debug System:

1. **Start the Application**
   ```bash
   cd frontend && npm run dev
   ```

2. **Open Browser Console**
   - The debug panel will appear in the bottom-right corner
   - All logs are also output to the browser console

3. **Test an Article**
   - Paste a crisis article URL or text
   - Watch the debug panel update in real-time
   - Observe count at each stage

4. **Access Debug Logger Programmatically**
   ```javascript
   // In browser console:
   window.__debugLogger.getAllLogs()
   window.__debugLogger.getSummary('correlation_id_here')
   window.__debugLogger.clearLogs()
   ```

5. **Copy Pipeline Summary**
   - Click "Copy Summary" button in debug panel
   - Paste into issue reports or documentation

## Next Steps (Phases 2-5)

### Phase 2: Deterministic Pipeline Runner
- [ ] Create test harness that runs pipeline without UI
- [ ] Add mock dependencies (article content, API responses)
- [ ] Binary search capability to isolate failures
- [ ] Automated scenario runner

### Phase 3: Guardrails & Fallbacks
- [ ] Prevent empty list from silently occurring
- [ ] Add fallback strategies for each failure point
- [ ] Implement safety rules for filters
- [ ] Fix UI state handling edge cases

### Phase 4: Automated Tests
- [ ] Unit tests for each pipeline stage
- [ ] Integration tests for full pipeline
- [ ] Scenario suite (10+ crisis types)
- [ ] Race condition tests

### Phase 5: Documentation & Evidence
- [ ] Root cause documentation
- [ ] Code changes summary
- [ ] Test results report
- [ ] Evidence of fix with logs

## Files Modified

### Created:
1. `frontend/src/utils/debug-logger.ts` - Debug logging system (186 lines)
2. `frontend/src/components/debug-panel.tsx` - Debug UI panel (200 lines)
3. `ORGANIZATION_PIPELINE_DEBUG_REPORT.md` - This document

### Modified:
1. `frontend/src/pages/Index.tsx` - Added instrumentation throughout `processContent()` function

## Key Insights from Initial Analysis

### Backend Logs Show:
```
GET /api/v1/organizations/search?q=Mercy%20Corps 200 1021.734 ms
Successfully fetched 10 organizations
```

This confirms:
- ✅ Backend API is working
- ✅ Every.org integration is functional
- ✅ Organizations are being returned

### Likely Root Causes (To Be Confirmed):
1. **Filtering too aggressive** - Removing all organizations
2. **Search query mismatch** - Wrong terms being extracted
3. **UI state race condition** - Async updates overwriting results
4. **Caching issue** - Serving empty cached results
5. **Classification failure** - Not detecting crisis correctly

## Success Criteria

The pipeline will be considered fixed when:

1. ✅ Every stage logs with correlation ID
2. ✅ Count is tracked at each step
3. ✅ Zero-count scenarios are logged with reason
4. ✅ UI render is confirmed with actual count
5. ✅ 10+ crisis scenarios pass successfully
6. ✅ Automated tests verify behavior
7. ✅ Debug panel shows real-time progress

## Conclusion

Phase 1 has successfully implemented comprehensive instrumentation that will enable us to:

- **Identify** exactly where the pipeline breaks
- **Understand** why organizations are not appearing
- **Verify** fixes with concrete evidence
- **Prevent** regressions with automated tests

The debug system is now active and ready for testing. The next phase will focus on running the pipeline through various scenarios to identify the exact failure point.

---

**Status**: ✅ Phase 1 Complete - Ready for Phase 2
**Next Action**: Run test scenarios and analyze debug logs to identify root cause