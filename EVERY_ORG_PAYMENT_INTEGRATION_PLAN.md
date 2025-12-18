# Every.org Payment Integration Plan

## 1. Executive Summary

This document outlines the integration strategy for Every.org payment gateway into the Cozy Phoenix Run (FeelGive) platform. The current implementation utilizes a "Deep Link" strategy where users are redirected to Every.org to complete their donation. The immediate goal is to stabilize this MVP approach by ensuring data integrity through verified charity slugs, while laying the groundwork for a more robust backend integration using webhooks in the future.

## 2. Current State Assessment

### ✅ Implemented Features
*   **Frontend Architecture**: A dedicated utility module (`frontend/src/utils/every-org.ts`) handles URL generation and feature flagging.
*   **UI Components**: `DonationForm` supports a toggleable "Every.org Mode" vs "Demo Mode" via the `VITE_ENABLE_EVERY_ORG_PAYMENTS` environment variable.
*   **Data Models**: The backend `Donation` model supports `paymentProvider` ('every_org') and `charitySlug` fields.
*   **Verified Data**: A curated list of 59 verified nonprofits exists in `frontend/src/data/charities-verified.ts` to prevent broken links.

### ⚠️ Identified Gaps
*   **Optimistic Tracking**: The application currently records a donation as "completed" locally 1.5 seconds after the user clicks the redirect link. This creates a data discrepancy if the user abandons the flow on Every.org.
*   **Data Source Consistency**: The application may still be using the unverified `charities.ts` list in some places, creating a risk of 404 errors during redirect.
*   **No Feedback Loop**: There is currently no backend channel (webhook) to confirm successful transactions from Every.org.

## 3. Architecture Overview

### Donation Flow (Current MVP - Deep Link)
1.  **User Selection**: User selects a charity and amount on FeelGive.
2.  **Validation**: Frontend validates the charity has a verified Every.org slug.
3.  **Redirect**: 
    *   User clicks "Donate".
    *   App opens `https://www.every.org/{slug}?amount={cents}&source=feelgive` in a new tab.
4.  **Local Logging**: App creates a `pending` (or currently `completed`) donation record in the MongoDB database via `POST /api/v1/donations`.

### Donation Flow (Future - Robust)
1.  **Initiation**: User clicks donate.
2.  **Redirect**: User is redirected to Every.org.
3.  **Processing**: User completes payment on Every.org.
4.  **Confirmation**: Every.org sends a webhook to FeelGive Backend.
5.  **Finalization**: Backend updates donation status from `pending` to `completed`.

## 4. Implementation Requirements

### 4.1 Frontend Requirements
*   **Data Migration**: fully replace `charities.ts` imports with `charities-verified.ts`.
*   **UX Refinement**:
    *   Update the "Donation Successful" feedback to be more accurate (e.g., "Redirecting to secure payment...").
    *   Consider a "Did you complete your donation?" follow-up modal if webhooks aren't available yet.
*   **Analytics**: Ensure `source=feelgive` is present in all generated URLs for attribution.

### 4.2 Backend Requirements
*   **API Endpoints**:
    *   `POST /api/v1/donations`: (Existing) Ensure it accepts `paymentProvider: 'every_org'`.
    *   `POST /api/v1/webhooks/every-org`: (New) Endpoint to receive transaction events (if/when API access is granted).
*   **Database**:
    *   Ensure `Donation` schema `status` defaults to `pending` for external payments, not `completed`.

### 4.3 Security Considerations
*   **Link Security**: Ensure all external links use `rel="noopener noreferrer"`.
*   **Input Sanitization**: Validate all URL parameters (amount, frequency) before generating the redirect link.
*   **API Keys**: If upgrading to Every.org Partner API, store keys in secure environment variables (`EVERY_ORG_API_KEY`).

## 5. Integration Steps

### Phase 1: Stabilization (Immediate)
1.  **Switch Data Source**: Refactor `frontend/src/utils/charity-matching.ts` and other consumers to use `VERIFIED_CHARITIES` exclusively.
2.  **Update Donation Status Logic**: Modify frontend `DonationForm` to send `status: 'pending'` (if supported) or explicitly log it as an "attempt" rather than a guaranteed donation.
3.  **Environment Setup**: Verify `VITE_ENABLE_EVERY_ORG_PAYMENTS=true` in the production build pipeline.

### Phase 2: Verification (Short-term)
4.  **Manual Smoke Test**: Perform end-to-end tests with the 5 high-priority charities (UNICEF, Red Cross, etc.) to ensure deep links land on the correct donation page.
5.  **Mobile Testing**: Verify deep link behavior on iOS/Android browsers (handling of new tabs/popups).

### Phase 3: Partner Integration (Long-term)
6.  **Partner Application**: Contact Every.org to register "Cozy Phoenix Run" as a partner to get API access.
7.  **Webhook Implementation**: Build the backend webhook listener.
8.  **Reconciliation**: Create a background job to reconcile "pending" donations that never received a webhook (mark as abandoned after 24h).

## 6. Testing Strategy

*   **Unit Tests**:
    *   Test `generateEveryOrgUrl` for correct parameter encoding (cents vs dollars).
    *   Test `validateCharityForEveryOrg` against edge case data.
*   **Manual Testing**:
    *   **Happy Path**: Click Donate -> Redirect -> Page Loads -> Correct Amount/Charity Pre-filled.
    *   **Edge Cases**: 
        *   Browser popup blocker enabled.
        *   Invalid/Missing verified slug (should disable button).
        *   Network failure during local logging.

## 7. Deployment Considerations

*   **Environment Variables**:
    ```env
    # Frontend
    VITE_ENABLE_EVERY_ORG_PAYMENTS=true
    ```
*   **Secrets**: No sensitive API keys are required for the Deep Link MVP.
*   **Rollback**: If Every.org links fail, simply set `VITE_ENABLE_EVERY_ORG_PAYMENTS=false` to revert to Demo Mode instantly.