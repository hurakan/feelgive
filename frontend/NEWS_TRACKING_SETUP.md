# News Tracking Feature - Setup Guide

## 🎯 What's New

Users can now track news from specific locations and get personalized article recommendations!

### Features Added:
1. **Settings Modal** - Manage tracked locations
2. **Location Types** - Track by region, country, or city
3. **State and Country Selection for Cities** - Precise city identification with state/province support
4. **News Feed** - Personalized articles from tracked locations
5. **Direct Analysis** - Click any news article to start donation flow
6. **Auto-refresh** - News updates when app opens
7. **Manual Refresh** - Refresh button for latest articles

---

## 🔧 Setup Instructions

### 1. Get NewsAPI Key (Required)

1. Go to https://newsapi.org
2. Click "Get API Key"
3. Sign up for free account
4. Copy your API key

**Free Tier Limits:**
- 100 requests per day
- Good for testing/MVP
- Upgrade to paid plan for production

### 2. Configure Environment Variable

Create a `.env` file in the project root:

```bash
VITE_NEWS_API_KEY=your_actual_api_key_here
```

**Important:** 
- Don't commit `.env` to git (already in `.gitignore`)
- Use `.env.example` as template

### 3. Restart Dev Server

```bash
npm run dev
```

---

## 📱 How to Use

### For Users:

1. **Open Settings**
   - Click the gear icon (⚙️) in the top right

2. **Add Locations**
   - Choose type: Region, Country, or City
   - **For Cities:** Select country first, then state (if applicable), then enter city name
   - Click "Add Location"
   - Repeat for multiple locations

3. **View News Feed**
   - News appears on the main "Give" tab
   - Shows 5 articles per tracked location
   - Auto-refreshes on app open
   - Manual refresh button available

4. **Analyze Articles**
   - Click any article card
   - Automatically starts analysis
   - Proceeds to donation flow

### Location Types:

**Regions:**
- North America, South America, Europe, Africa, Asia, etc.
- Shows news ABOUT the region

**Countries:**
- United States, Sudan, Mexico, Cambodia, etc.
- Shows news FROM and ABOUT the country

**Cities:**
- **NEW:** Select country and state (if applicable) for precise identification
- Examples:
  - **United States:** Los Angeles, California
  - **Canada:** Toronto, Ontario
  - **United Kingdom:** London
  - **Australia:** Sydney, New South Wales
  - **India:** Mumbai, Maharashtra
  - **Brazil:** São Paulo
- Searches within 100-mile radius
- Supports cities worldwide with state/province selection for US, Canada, Australia, India, Brazil, and Mexico

---

## 🌍 Supported Countries with State/Province Selection

### Countries with State Selection:
- 🇺🇸 **United States** - All 50 states
- 🇨🇦 **Canada** - Provinces and territories
- 🇦🇺 **Australia** - States and territories
- 🇮🇳 **India** - States and union territories
- 🇧🇷 **Brazil** - States
- 🇲🇽 **Mexico** - States

### All Countries Supported for City Tracking:
Cities from any country can be tracked. State/province selection is required for the countries listed above to ensure precise location identification.

---

## 🎨 UI Changes

### City Input (NEW):

```
┌─────────────────────────────┐
│ Location Type: City          │
│                              │
│ Country: [United States ▼]  │
│                              │
│ State/Province: [California ▼]│
│                              │
│ City Name:                   │
│ [Los Angeles_______]         │
│ State selection is required. │
│                              │
│ [Add Location]               │
└─────────────────────────────┘
```

### Why State Selection Matters:

**Before (Ambiguous):**
- User enters "Springfield"
- Could be Springfield, IL OR Springfield, MA OR 30+ other Springfields
- ❌ Wrong location might be selected

**After (Precise):**
- User selects "United States" → "Illinois" → "Springfield"
- ✅ Correctly identifies Springfield, Illinois

---

## 🔍 Technical Details

### New Files Created:

1. **`src/types/index.ts`** - Added `TrackedLocation` with state/country fields and `NewsArticle` types
2. **`src/utils/tracked-locations.ts`** - Location management with US states list
3. **`src/utils/geocoding.ts`** - City → coordinates with state and country parameters
4. **`src/utils/news-api.ts`** - NewsAPI integration with 100-mile radius
5. **`src/components/settings-modal.tsx`** - Settings UI with country and state selectors
6. **`src/components/news-feed.tsx`** - News display
7. **`.env.example`** - Environment variable template

### Updated Files:

1. **`src/pages/Index.tsx`** - Integrated settings and news feed

### Data Storage:

**localStorage Key:** `feelgive_tracked_locations`

**Structure:**
```typescript
[
  {
    id: "loc_1234567890_abc123",
    type: "country",
    value: "Sudan",
    displayName: "Sudan",
    createdAt: 1234567890000
  },
  {
    id: "loc_1234567891_def456",
    type: "city",
    value: "Los Angeles",
    state: "California",
    country: "US",
    displayName: "Los Angeles, California, United States",
    coordinates: { lat: 34.0522, lng: -118.2437 },
    createdAt: 1234567891000
  }
]
```

### Geocoding with State and Country:

```typescript
// Without state (less precise)
geocodeCity("Springfield", undefined, "US")

// With state (precise)
geocodeCity("Springfield", "Illinois", "US")
geocodeCity("Springfield", "Massachusetts", "US")
```

### API Caching:

- News cached for 30 minutes
- Reduces API calls
- Improves performance
- Manual refresh clears cache

---

## 🚨 Limitations & Notes

### NewsAPI Free Tier:
- 100 requests/day
- No historical data (last 30 days only)
- Rate limited
- Some sources may be restricted

### Geocoding:
- Uses free OpenStreetMap Nominatim
- Rate limited (1 request/second)
- May not find all cities
- Requires internet connection
- **NEW:** State and country parameters ensure precise identification

### City Names:
- Common city names may exist in multiple locations
- State selection required for US, Canada, Australia, India, Brazil, and Mexico
- Validation is lenient (2-100 characters)
- 100-mile radius for news search

### Production Considerations:
- Need paid NewsAPI plan for production
- Consider alternative news sources
- Implement proper error handling
- Add retry logic for failed requests
- Monitor API usage

---

## 🐛 Troubleshooting

### "Could not find city"
- **Cause:** City name doesn't exist in selected state/country
- **Solution:**
  - Check you selected the correct country and state
  - Verify city name spelling
  - Try a larger nearby city

### "No recent news found"
- **Cause:** NewsAPI returned no results
- **Solution:** Try different location or check API key

### "Failed to add location"
- **Cause:** Geocoding failed for city
- **Solution:**
  - Verify country and state selection is correct
  - Check city name spelling
  - Try a major city first

### "Failed to load news"
- **Cause:** API key invalid or rate limit exceeded
- **Solution:** Check `.env` file, wait for rate limit reset

### News not refreshing
- **Cause:** Cache still valid (30 min)
- **Solution:** Click manual refresh button

### Wrong location for city
- **Cause:** State not selected or wrong state/country
- **Solution:**
  - Always select country and state (if applicable) first
  - Double-check state matches city
  - Remove and re-add with correct state/country

---

## 🎯 Testing Checklist

- [ ] Settings modal opens/closes
- [ ] Can add region
- [ ] Can add country
- [ ] **Can select country for city**
- [ ] **State selector appears for countries with states**
- [ ] **State selection is required for US cities**
- [ ] Can add city (US with state, international without state)
- [ ] **Same city name in different states creates different locations**
- [ ] Can remove location
- [ ] News feed shows articles
- [ ] Can click article to analyze
- [ ] Auto-refresh on app open
- [ ] Manual refresh works
- [ ] Multiple locations work
- [ ] Empty state shows when no locations
- [ ] Error handling works

---

## 🚀 Future Enhancements

1. **More News Sources**
   - Google News API
   - RSS feeds
   - Direct publisher APIs

2. **Better Filtering**
   - Filter by crisis type
   - Filter by date range
   - Filter by source

3. **Notifications**
   - Push notifications for new articles
   - Email digests
   - Breaking news alerts

4. **Saved Articles**
   - Bookmark articles
   - Read later list
   - Share articles

5. **Analytics**
   - Track which locations get most clicks
   - Popular news sources
   - User engagement metrics

6. **City Tracking Enhancements**
   - Auto-suggest cities as you type
   - Show map preview
   - Radius adjustment (50-500 miles)
   - Support for neighborhoods/districts

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Verify API key in `.env`
3. Check NewsAPI dashboard for usage
4. Verify country and state selection for cities
5. Review this guide

**Questions?** Open an issue or contact support.

---

**Feature Status:** ✅ Complete and Ready for Testing
**Latest Update:** Replaced postal code tracking with city/state/country selection for precise location identification. News radius changed to 100 miles.