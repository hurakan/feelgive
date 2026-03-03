# AI Decision Authority Matrix

**Last Updated:** 2026-02-01  
**Purpose:** Define clear boundaries for AI autonomous actions vs. human-required approvals

---

## Level 0: AI Can Proceed Autonomously ✅

**No approval needed. AI can execute immediately.**

### Documentation & Comments
- Adding code comments
- Updating documentation files (*.md)
- Adding JSDoc/TSDoc comments
- Creating README files
- Fixing typos in comments/docs

### Read-Only Operations
- `read_file` - Reading any file
- `list_files` - Listing directory contents
- `search_files` - Searching for patterns
- `list_code_definition_names` - Analyzing code structure

### Test Files (Creation Only)
- Creating new test files (`*.test.ts`, `*.spec.ts`)
- Adding test cases to existing test files
- Creating test fixtures/mocks

### Code Formatting
- Fixing indentation
- Adding/removing whitespace
- Organizing imports (if no logic changes)

---

## Level 1: AI Must Ask First (Quick Approval) ⚠️

**AI must present the change and get explicit "yes" before proceeding.**

### Configuration Values
- Changing thresholds (e.g., `CAUSE_THRESHOLD = 40`)
- Modifying timeouts, delays, retry counts
- Updating cache TTL values
- Changing API rate limits
- Modifying scoring weights

### Dependencies
- Adding new npm packages
- Updating package versions
- Removing dependencies

### API Changes
- Adding new endpoints
- Modifying request/response schemas
- Changing HTTP methods
- Adding/removing query parameters

### Database
- Schema changes (adding/removing fields)
- Index modifications
- Migration scripts

### Environment Variables
- Adding new env vars
- Changing env var names
- Modifying .env.example

---

## Level 2: AI Must Present Options (Requires Discussion) 🔍

**AI must present 2-4 options with pros/cons and wait for decision.**

### Architecture Decisions
- Changing system design patterns
- Introducing new architectural layers
- Modifying data flow
- Changing caching strategies

### Algorithm Changes
- Modifying scoring algorithms
- Changing recommendation logic
- Updating classification rules
- Altering ranking systems

### Performance Trade-offs
- Optimizations that sacrifice readability
- Caching strategies with memory implications
- Batch processing vs. real-time
- Parallelization approaches

### Security-Related
- Authentication/authorization changes
- Data validation rules
- Rate limiting strategies
- CORS configuration

### Third-Party Integrations
- Adding new external APIs
- Changing API providers
- Modifying integration patterns

---

## Level 3: Human-Only Decisions 🚫

**AI cannot make these decisions under any circumstances.**

### Production & Deployment
- Deploying to production
- Modifying CI/CD pipelines
- Changing deployment configurations
- Database migrations in production

### Breaking Changes
- Removing public APIs
- Changing API contracts (breaking)
- Removing features
- Major version bumps

### Cost-Impacting
- Changing API usage patterns (rate limits)
- Adding expensive operations
- Modifying billing-related code
- Resource allocation changes

### Legal & Compliance
- License changes
- Terms of service modifications
- Privacy policy updates
- Data retention policies

### Business Logic
- Pricing changes
- Feature flags (enabling/disabling)
- A/B test configurations
- User-facing copy changes

---

## Escalation Process

### When AI is Unsure
If AI cannot determine the decision level:
1. **Default to Level 2** (present options)
2. Explain the uncertainty
3. Ask human to classify the decision

### Emergency Override
Human can override any level with explicit instruction:
- "Just do it" → AI proceeds (Level 0 treatment)
- "Show me options first" → AI escalates to Level 2

---

## Examples

### ✅ Level 0 Example (Autonomous)
```markdown
AI: "I'm adding a comment to explain the NTEE scoring logic."
→ AI proceeds without asking
```

### ⚠️ Level 1 Example (Quick Approval)
```markdown
AI: "I need to change CAUSE_THRESHOLD from 40 to 25. Approve?"
Human: "Yes"
→ AI proceeds
```

### 🔍 Level 2 Example (Options Required)
```markdown
AI: "NTEE codes are missing. Here are 4 options:
1. Lower threshold to 25 (quick, may reduce precision)
2. Fetch from Details API (complete, slower)
3. Make NTEE optional (balanced, inconsistent)
4. Remove NTEE scoring (simple, loses signal)

Which should I implement?"
Human: "Option 3"
→ AI proceeds with Option 3
```

### 🚫 Level 3 Example (Forbidden)
```markdown
AI: "I cannot deploy to production. Please deploy manually or give explicit deployment approval."
→ AI waits for human action
```

---

## Modification History

| Date | Change | Reason |
|------|--------|--------|
| 2026-02-01 | Initial version | Establish governance framework |

---

## Notes

- This document is version-controlled
- AI must check this file before making ANY change
- Human can update this document at any time
- When in doubt, AI escalates to Level 2