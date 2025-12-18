# FeelGive - Project Context & Documentation

**Last Updated:** December 2024  
**Project Type:** Frontend-only React/TypeScript MVP  
**Status:** Core MVP Complete - Ready for Testing & Iteration

---

## 📋 Executive Summary

FeelGive is an emotion-driven micro-donation platform that helps users turn moments of empathy into immediate action. When users encounter news stories that move them, FeelGive uses AI to identify the cause, match them with vetted organizations, and facilitate quick donations.

**Core Value Proposition:** "Turn moments of emotion into moments of impact"

---

## 🎯 Current Implementation Status

### ✅ Completed Features

1. **Dual Input System**
   - URL-based article fetching (with CORS proxy fallbacks)
   - Direct text paste (recommended due to news site blocking)
   - Smart URL normalization
   - Comprehensive error handling

2. **AI Classification System**
   - 5 cause categories: Disaster Relief, Health Crisis, Climate Events, Humanitarian Crisis, Social Justice
   - Semantic pattern matching with 100+ keywords per category
   - Confidence scoring (40-95% range)
   - Geographic detection
   - Affected groups identification
   - Relevant excerpt extraction

3. **Organization Matching**
   - 15 fully profiled organizations across all causes
   - Trust score system (88-97% range)
   - 3-tier vetting levels (Partner Only, Partner + Review, Direct)
   - Cause-based filtering
   - Geographic relevance scoring
   - Top 3 recommendations per classification

4. **Organization Profiles**
   - Complete legal identity (EIN, registration, founding year)
   - Mission statements and program areas
   - Geographic reach and regions served
   - Recent highlights and achievements
   - Impact metrics with visual cards
   - Notable partnerships
   - Social media links
   - Modal-based detail view

5. **Donation Flow**
   - Quick amount selection ($1, $2, $5, $10)
   - Custom amount input ($1-$1,000 range)
   - Optional email for receipts
   - Email persistence across sessions
   - Form validation with helpful errors
   - Processing simulation (2s delay)
   - Accessibility features (ARIA labels, keyboard nav)

6. **Impact Tracking**
   - localStorage-based donation history
   - Total donated calculation
   - Monthly donation tracking
   - Cause breakdown visualization
   - Recent donations list (last 10)
   - AI-generated impact messages
   - Monthly/weekly summaries

7. **UX/UI Excellence**
   - Mobile-first responsive design
   - Gradient color schemes (primary blue, secondary orange)
   - Trust score visualizations
   - Loading states with stage indicators
   - Empty states with onboarding
   - Confirmation celebrations
   - Toast notifications
   - Smooth transitions and animations
   - Dark mode support

8. **Classification Transparency**
   - "How We Matched You" reasoning cards
   - Matched keywords display
   - Relevant excerpts from article
   - Confidence percentage
   - Geographic and demographic context
   - Vetting level explanations

9. **Edge Cases Handled**
   - No matching charities detected
   - Classification failure
   - URL fetch errors
   - Invalid input validation
   - Monthly donation caps (optional)
   - Network timeouts

---

## 🏗️ Technical Architecture

### Tech Stack
- **Framework:** React 18 with TypeScript
- **Routing:** React Router v6
- **Styling:** Tailwind CSS + shadcn/ui components
- **State:** React hooks (useState, useEffect)
- **Storage:** localStorage for persistence
- **Icons:** Lucide React
- **Notifications:** Sonner (toast library)
- **Build:** Vite

### Key Dependencies
```json
{
  "react": "^18.3.1",
  "react-router-dom": "^6.26.2",
  "tailwindcss": "^3.4.11",
  "lucide-react": "^0.462.0",
  "sonner": "^1.5.0",
  "@radix-ui/*": "Multiple UI primitives"
}
```

### Project Structure
```
src/
├── components/
│   ├── ui/                          # shadcn/ui components
│   ├── share-target-input.tsx       # Dual input (URL/Text)
│   ├── loading-state.tsx            # 3-stage loading
│   ├── classification-result.tsx    # Cause display
│   ├── classification-reasoning.tsx # Transparency card
│   ├── no-charities-available.tsx   # Edge case handling
│   ├── charity-card.tsx             # Organization cards
│   ├── organization-profile.tsx     # Detailed modal
│   ├── donation-form.tsx            # Payment form
│   ├── donation-confirmation.tsx    # Success screen
│   ├── impact-summary.tsx           # History view
│   └── empty-state.tsx              # Onboarding
├── utils/
│   ├── classification.ts            # AI classification logic
│   ├── charity-matching.ts          # Organization matching
│   ├── content-fetcher.ts           # Article fetching
│   ├── donations.ts                 # Donation persistence
│   └── storyteller.ts               # Impact messages
├── data/
│   └── charities.ts                 # 15 organization profiles
├── types/
│   └── index.ts                     # TypeScript interfaces
├── pages/
│   ├── Index.tsx                    # Main app page
│   └── NotFound.tsx                 # 404 page
└── App.tsx                          # Router setup
```

---

## 🔑 Key Implementation Details

### Classification Algorithm

**Scoring System:**
- Core indicators: 3 points each (must have ≥1)
- Supporting context: 1.5 points each
- Action indicators: 2 points each
- Negative indicators: -2 points each
- Geographic match: +1 point

**Minimum Thresholds:**
- Disaster Relief: 5 points
- Health Crisis: 5 points
- Climate Events: 5 points
- Humanitarian Crisis: 6 points
- Social Justice: 5 points

**Confidence Calculation:**
```typescript
confidence = Math.min(0.95, 0.4 + (score * 0.04))
if (scoreDiff > 3) confidence += 0.1
```

### Organization Data Model

```typescript
interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string; // Emoji
  causes: CauseCategory[];
  countries: string[];
  trustScore: number; // 88-97
  vettingLevel: 'partner_only' | 'partner_pg_review' | 'pg_direct';
  isActive: boolean;
  profile: CharityProfile; // Detailed info
}
```

### Donation Data Model

```typescript
interface Donation {
  id: string; // "don_timestamp_random"
  charityId: string;
  charityName: string;
  amount: number;
  cause: CauseCategory;
  geo: string;
  timestamp: number;
  articleUrl?: string;
  articleTitle?: string;
}
```

### localStorage Keys
- `feelgive_donations` - Array of Donation objects
- `feelgive_user_prefs` - User preferences (email, monthly cap)

---

## 🎨 Design System

### Color Palette
```css
/* Light Mode */
--primary: 198 93% 60% (Blue)
--secondary: 43 96% 56% (Orange)
--accent: 340 82% 67% (Pink)
--success: 142 76% 36% (Green)
--destructive: 0 84.2% 60.2% (Red)

/* Trust Score Colors */
95-100%: Emerald (Excellent)
90-94%: Blue (Very Good)
85-89%: Amber (Good)
```

### Typography
- Headings: Bold, gradient text for emphasis
- Body: Base size 14-16px, line-height 1.5
- Labels: 12-14px, uppercase tracking for sections

### Spacing
- Card padding: 1.5rem (24px)
- Section gaps: 1.5-2rem (24-32px)
- Button height: 3rem (48px) for primary actions

---

## 🚀 User Flows

### Primary Flow: URL Input
1. User pastes article URL
2. System fetches content (3 CORS proxies)
3. AI classifies cause (3-stage loading)
4. Shows classification + reasoning
5. Displays 3 matched organizations
6. User selects organization
7. User enters donation amount
8. Confirmation + impact message
9. History updated

### Alternative Flow: Text Paste
1. User pastes article text
2. Optional: adds title
3. AI classifies cause (skip fetch stage)
4. [Same as steps 4-9 above]

### Edge Flow: No Matches
1. Classification succeeds
2. No organizations match criteria
3. Show "No Charities Available" card
4. Display detected themes
5. Offer "Notify Me" option
6. Allow trying different article

---

## 📊 Data & Content

### Organization Coverage
- **Disaster Relief:** 3 orgs (Global, North America, Global)
- **Health Crisis:** 3 orgs (Global, Africa/Asia, Global)
- **Climate Events:** 3 orgs (Global, Multi-region, Coastal)
- **Humanitarian Crisis:** 3 orgs (Global, Africa/Middle East/Asia, Conflict zones)
- **Social Justice:** 3 orgs (Global, US/Latin America/Africa, Global)

### Geographic Coverage
- Global: 9 organizations
- Regional: 6 organizations
- Countries covered: 50+

### Trust Scores Distribution
- 95-97%: 3 organizations (pg_direct)
- 90-94%: 8 organizations (partner_pg_review)
- 88-89%: 4 organizations (partner_only)

---

## 🐛 Known Issues & Limitations

### Technical Limitations
1. **CORS Proxy Reliability:** Free proxies (allorigins, corsproxy, codetabs) are unreliable
   - **Mitigation:** Text paste option as primary method
   - **Future:** Backend proxy service

2. **Frontend-Only Classification:** No real AI/ML model
   - **Current:** Rule-based semantic matching
   - **Future:** OpenAI API integration

3. **No Real Donations:** Demo mode only
   - **Current:** Simulated 2s processing
   - **Future:** Every.org API integration

4. **localStorage Limits:** ~5-10MB browser storage
   - **Current:** Sufficient for MVP
   - **Future:** Backend database

### UX Considerations
1. **URL Fetching Often Fails:** News sites block automated access
   - **Solution:** Prominent "Paste Text" option with green alert
   
2. **Classification May Miss Nuance:** Rule-based system has limits
   - **Solution:** Transparent reasoning shows why/how matched

3. **No User Accounts:** Can't sync across devices
   - **Solution:** Email capture for future account creation

---

## 🔮 Next Steps & Roadmap

### Immediate Priorities
1. **User Testing:** Get real users trying the flow
2. **Classification Tuning:** Adjust thresholds based on test data
3. **Error Handling:** Improve messaging for edge cases
4. **Performance:** Optimize loading states

### Phase 2 Features
1. **Backend Integration:**
   - Proper article fetching service
   - OpenAI API for classification
   - Every.org donation API
   - User authentication

2. **Enhanced Features:**
   - Donation receipts via email
   - Monthly impact reports
   - Social sharing
   - Recurring donations
   - Organization favorites

3. **Mobile App:**
   - Native share target
   - Push notifications
   - Offline support

### Phase 3 Expansion
1. **Publisher SDK:** Inline donation widgets
2. **Messaging Bots:** WhatsApp, Telegram integration
3. **Event Triggers:** Automated donation suggestions
4. **Portfolio Management:** Unified impact wallet
5. **AI Agents:** Advanced fraud detection, storytelling

---

## 💻 Development Commands

```bash
# Install dependencies
npm install

# Start dev server (port 5137)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npx tsc --noEmit

# Linting
npm run lint
```

---

## 🔧 Configuration Files

### vite.config.ts
```typescript
export default defineConfig({
  server: {
    host: "::",
    port: 5137,
  },
  plugins: [dyadComponentTagger(), react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### tailwind.config.ts
- Custom color system with CSS variables
- Dark mode support
- Custom animations (accordion, etc.)
- Container utilities

---

## 📝 Code Snippets

### Classification Example
```typescript
const result = await classifyContent(url, title, text);
// Returns: Classification | null

if (!result) {
  // No cause detected
} else if (!result.hasMatchingCharities) {
  // Cause detected but no orgs available
} else {
  // Success - show matched organizations
  const charities = matchCharities(result);
}
```

### Donation Persistence
```typescript
// Save donation
const donation: Donation = {
  id: generateDonationId(),
  charityId: charity.id,
  charityName: charity.name,
  amount: 10,
  cause: 'disaster_relief',
  geo: 'global',
  timestamp: Date.now(),
};
saveDonation(donation);

// Retrieve history
const donations = getDonations();
const total = getTotalDonated();
const monthTotal = getCurrentMonthTotal();
```

### Organization Matching
```typescript
const matches = matchCharities(classification);
// Returns top 3 organizations sorted by:
// 1. Cause alignment
// 2. Geographic relevance
// 3. Trust score + vetting level
```

---

## 🎯 Success Metrics (Future)

### User Engagement
- Conversion rate: URL/Text → Classification
- Selection rate: Classification → Organization chosen
- Completion rate: Organization → Donation completed
- Return rate: Users making 2+ donations

### Impact Metrics
- Total donations processed
- Average donation amount
- Organizations supported
- Causes covered
- Geographic reach

### Technical Metrics
- Classification accuracy
- Average response time
- Error rate by type
- Browser/device distribution

---

## 🤝 Integration Points (Future)

### Every.org API
```typescript
// Donation endpoint
POST /api/donate
{
  nonprofitId: string,
  amount: number,
  currency: 'USD',
  email?: string,
  metadata: {
    source: 'feelgive',
    articleUrl?: string,
    cause: CauseCategory
  }
}
```

### OpenAI API
```typescript
// Classification endpoint
POST /api/classify
{
  content: string,
  title?: string,
  url?: string
}

// Returns structured classification
```

---

## 📚 Resources & References

### Design Inspiration
- Charity: Water (impact storytelling)
- GoFundMe (quick donation flow)
- Patreon (recurring support)
- Product Hunt (clean card layouts)

### Technical References
- shadcn/ui documentation
- Tailwind CSS best practices
- React accessibility guidelines
- localStorage best practices

### Charity Data Sources
- GuideStar/Candid
- Charity Navigator
- Every.org nonprofit database
- Direct organization websites

---

## 🔐 Security Considerations

### Current (MVP)
- No sensitive data stored
- Client-side only processing
- No payment information handled
- localStorage is domain-isolated

### Future (Production)
- HTTPS required
- PCI DSS compliance for payments
- User authentication (OAuth 2.0)
- API rate limiting
- Input sanitization
- CSRF protection
- XSS prevention

---

## 📱 Browser Support

### Tested & Supported
- Chrome 90+ ✅
- Firefox 88+ ✅
- Safari 14+ ✅
- Edge 90+ ✅

### Mobile
- iOS Safari 14+ ✅
- Chrome Mobile 90+ ✅
- Samsung Internet 14+ ✅

### Required Features
- localStorage
- Fetch API
- ES6+ JavaScript
- CSS Grid & Flexbox
- CSS Custom Properties

---

## 🎓 Learning & Documentation

### Key Concepts Implemented
1. **Semantic Pattern Matching:** Rule-based NLP for classification
2. **Progressive Disclosure:** Information revealed as needed
3. **Optimistic UI:** Immediate feedback, async processing
4. **Micro-interactions:** Smooth transitions, hover states
5. **Accessibility First:** ARIA labels, keyboard navigation
6. **Mobile-First Design:** Responsive from smallest screens up

### Code Quality Practices
- TypeScript for type safety
- Component composition over inheritance
- Custom hooks for reusable logic
- Consistent naming conventions
- Comprehensive error handling
- User-friendly error messages

---

## 🚨 Troubleshooting

### Common Issues

**Issue:** "We couldn't identify a cause"
- **Cause:** Article doesn't match any semantic patterns
- **Solution:** Try more explicit crisis-related content, or adjust classification thresholds

**Issue:** URL fetching fails repeatedly
- **Cause:** News sites blocking CORS proxies
- **Solution:** Use "Paste Text" tab instead

**Issue:** Donations not persisting
- **Cause:** localStorage disabled or full
- **Solution:** Check browser settings, clear old data

**Issue:** Dark mode colors look wrong
- **Cause:** CSS variable inheritance issues
- **Solution:** Check tailwind.config.ts color definitions

---

## 📞 Contact & Support

**Project Owner:** [Your Name]  
**Repository:** [GitHub URL if applicable]  
**Documentation:** This file (PROJECT_CONTEXT.md)  
**Last Updated:** December 2024

---

## 🎉 Acknowledgments

- **shadcn/ui:** Excellent component library
- **Lucide:** Beautiful icon set
- **Tailwind CSS:** Utility-first styling
- **React Team:** Amazing framework
- **Every.org:** Inspiration for donation platform

---

**End of Context Document**

This file serves as comprehensive documentation for the FeelGive MVP. Use it as context when working with AI coding assistants or onboarding new developers.