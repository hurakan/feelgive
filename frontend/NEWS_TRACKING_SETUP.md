# News Tracking Feature - Setup Guide

## 🎯 What's New

Users can now track news from specific locations and get personalized article recommendations!

### Features Added:
1. **Settings Modal** - Manage tracked locations
2. **Location Types** - Track by region, country, or postal code
3. **Country Selection for Postal Codes** - Disambiguate postal codes by country
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
   - Choose type: Region, Country, or Postal Code
   - **For Postal Codes:** Select country first, then enter code
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

**Postal Codes:**
- **NEW:** Select country first to avoid ambiguity
- Examples:
  - **United States:** 90210, 10001
  - **Canada:** M5H 2N2
  - **United Kingdom:** SW1A 1AA
  - **Australia:** 2000
  - **Germany:** 10115
  - **France:** 75001
- Searches within 200-mile radius
- Supports 30+ countries

---

## 🌍 Supported Postal Code Countries

- 🇺🇸 United States
- 🇨🇦 Canada
- 🇬🇧 United Kingdom
- 🇦🇺 Australia
- 🇩🇪 Germany
- 🇫🇷 France
- 🇮🇹 Italy
- 🇪🇸 Spain
- 🇳🇱 Netherlands
- 🇧🇪 Belgium
- 🇨🇭 Switzerland
- 🇦🇹 Austria
- 🇸🇪 Sweden
- 🇳🇴 Norway
- 🇩🇰 Denmark
- 🇫🇮 Finland
- 🇵🇱 Poland
- 🇨🇿 Czech Republic
- 🇵🇹 Portugal
- 🇮🇪 Ireland
- 🇳🇿 New Zealand
- 🇯🇵 Japan
- 🇰🇷 South Korea
- 🇸🇬 Singapore
- 🇮🇳 India
- 🇧🇷 Brazil
- 🇲🇽 Mexico
- 🇦🇷 Argentina
- 🇿🇦 South Africa

---

## 🎨 UI Changes

### Postal Code Input (NEW):

```
┌─────────────────────────────┐
│ Location Type: Postal Code  │
│                              │
│ Country: [United States ▼]  │
│                              │
│ Postal/Zip Code:             │
│ [90210____________]          │
│ Format: 5 digits (e.g., 90210)
│                              │
│ [Add Location]               │
└─────────────────────────────┘
```

### Before (Ambiguous):
- User enters "2000"
- Could be Sydney, Australia OR Switzerland
- ❌ Wrong location might be selected

### After (Clear):
- User selects "Australia" from dropdown
- Then enters "2000"
- ✅ Correctly identifies Sydney, Australia

---

## 🔍 Technical Details

### New Files Created:

1. **`src/types/index.ts`** - Added `TrackedLocation` and `NewsArticle` types
2. **`src/utils/tracked-locations.ts`** - Location management
3. **`src/utils/geocoding.ts`** - Postal code → coordinates with country parameter
4. **`src/utils/news-api.ts`** - NewsAPI integration
5. **`src/components/settings-modal.tsx`** - Settings UI with country selector
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
    type: "postal_code",
    value: "90210-US", // Stored with country code
    displayName: "90210 (Beverly Hills, CA, USA)",
    coordinates: { lat: 34.0901, lng: -118.4065 },
    createdAt: 1234567891000
  }
]
```

### Geocoding with Country:

```typescript
// Old (ambiguous)
geocodePostalCode("2000")

// New (precise)
geocodePostalCode("2000", "AU") // Australia
geocodePostalCode("2000", "CH") // Switzerland
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
- May not find all postal codes
- Requires internet connection
- **NEW:** Country parameter improves accuracy

### Postal Code Formats:
- Vary significantly by country
- Some countries have complex formats
- Validation is lenient (3-10 characters)
- Format hints shown for each country

### Production Considerations:
- Need paid NewsAPI plan for production
- Consider alternative news sources
- Implement proper error handling
- Add retry logic for failed requests
- Monitor API usage

---

## 🐛 Troubleshooting

### "Could not find postal code"
- **Cause:** Invalid format or code doesn't exist in selected country
- **Solution:** 
  - Check you selected the correct country
  - Verify postal code format for that country
  - Try a different postal code

### "No recent news found"
- **Cause:** NewsAPI returned no results
- **Solution:** Try different location or check API key

### "Failed to add location"
- **Cause:** Geocoding failed for postal code
- **Solution:** 
  - Verify country selection is correct
  - Check postal code format
  - Try a major city's postal code first

### "Failed to load news"
- **Cause:** API key invalid or rate limit exceeded
- **Solution:** Check `.env` file, wait for rate limit reset

### News not refreshing
- **Cause:** Cache still valid (30 min)
- **Solution:** Click manual refresh button

### Wrong location for postal code
- **Cause:** Country not selected or wrong country
- **Solution:** 
  - Always select country first
  - Double-check country matches postal code
  - Remove and re-add with correct country

---

## 🎯 Testing Checklist

- [ ] Settings modal opens/closes
- [ ] Can add region
- [ ] Can add country
- [ ] **Can select country for postal code**
- [ ] **Postal code format hint updates per country**
- [ ] Can add postal code (US, Canada, UK, Australia)
- [ ] **Same postal code in different countries creates different locations**
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

6. **Postal Code Enhancements**
   - Auto-detect country from format
   - Show map preview
   - Radius adjustment (50-500 miles)

---

## 📞 Support

If you encounter issues:
1. Check console for errors
2. Verify API key in `.env`
3. Check NewsAPI dashboard for usage
4. Verify country selection for postal codes
5. Review this guide

**Questions?** Open an issue or contact support.

---

**Feature Status:** ✅ Complete and Ready for Testing  
**Latest Update:** Added country selector for postal codes to eliminate ambiguity