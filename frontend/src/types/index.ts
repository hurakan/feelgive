// Every.org API Types
export interface EveryOrgNonprofit {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  coverImageUrl?: string;
  websiteUrl?: string;
  ein?: string;
  locationAddress?: string;
  primaryCategory?: string;
  nteeCode?: string;
  nteeCodeMeaning?: string;
}

export type CauseCategory =
  | 'disaster_relief'
  | 'health_crisis'
  | 'climate_events'
  | 'humanitarian_crisis'
  | 'social_justice';

export type CrisisType =
  | 'natural_disaster'
  | 'health_emergency'
  | 'conflict_displacement'
  | 'climate_disaster'
  | 'human_rights_violation'
  | 'none';

export type RootCause =
  | 'climate_driven'
  | 'conflict_driven'
  | 'poverty_driven'
  | 'policy_driven'
  | 'natural_phenomenon'
  | 'systemic_inequality'
  | 'multiple_factors'
  | 'unknown';

export type IdentifiedNeed =
  | 'food'
  | 'shelter'
  | 'medical'
  | 'water'
  | 'legal_aid'
  | 'rescue'
  | 'education'
  | 'mental_health'
  | 'winterization'
  | 'sanitation';

export type LocationType = 'region' | 'country' | 'city';

export interface TrackedLocation {
  id: string;
  type: LocationType;
  value: string;
  displayName: string;
  state?: string; // For city type - required for US cities
  country?: string; // For city type - required
  coordinates?: {
    lat: number;
    lng: number;
  };
  createdAt: number;
}

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  publishedAt: string;
  locationId: string;
  locationName: string;
  eventTag?: {
    type: CrisisType;
    label: string;
    confidence: number;
  };
}

export interface CharityProfile {
  fullLegalName: string;
  dbaName?: string;
  registrationNumber: string;
  yearFounded: number;
  headquarters: string;
  website: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
    linkedin?: string;
  };
  missionStatement: string;
  programAreas: string[];
  regionsServed: string[];
  recentHighlights: string[];
  impactMetrics: {
    label: string;
    value: string;
  }[];
  partnerships: string[];
}

export interface Charity {
  id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  causes: CauseCategory[];
  countries: string[];
  trustScore: number;
  vettingLevel: 'partner_only' | 'partner_pg_review' | 'pg_direct';
  isActive: boolean;
  profile?: CharityProfile; // Optional - full profile details
  geographicFlexibility: number;
  addressedNeeds: IdentifiedNeed[];
  everyOrgVerified?: boolean; // Whether the Every.org slug has been manually verified
  geographic_tier?: number; // 1-4: Geographic relevance tier for explainability
  cause_match_level?: number; // 1-3: Cause match level for explainability
}

// Extended charity interface with ranking metadata for explainability
export interface RankedCharity extends Charity {
  proximity_reason: string; // Human-readable explanation of geographic relevance
  cause_match_reason: string; // Human-readable explanation of cause match
  geographic_tier: number; // 1-4: Direct/Regional/Global-High/Global-Low
  cause_match_level: number; // 1-3: Perfect/Category/Related
  final_rank_score: number; // Composite score for debugging
}

export interface Classification {
  cause: CauseCategory;
  tier1_crisis_type: CrisisType;
  tier2_root_cause: RootCause;
  identified_needs: IdentifiedNeed[];
  geo: string;
  geoName: string;
  affectedGroups: string[];
  confidence: number;
  articleTitle?: string;
  articleUrl?: string;
  matchedKeywords: string[];
  relevantExcerpts: string[];
  hasMatchingCharities: boolean;
  detectedThemes?: string[];
  severityAssessment: {
    level: 'extreme' | 'high' | 'moderate' | 'low';
    deathToll?: number;
    peopleAffected?: number;
    systemStatus: 'collapsed' | 'overwhelmed' | 'strained' | 'coping' | 'normal';
    imminentRisk: boolean;
    reasoning: string;
  };
}

export interface Donation {
  id: string;
  charityId: string;
  charityName: string;
  amount: number;
  cause: CauseCategory;
  geo: string;
  timestamp: number;
  articleUrl?: string;
  articleTitle?: string;
}

export interface DonationFormData {
  amount: number;
  email?: string;
}

export interface UserProfile {
  totalDonations: number;
  totalAmount: number;
  favoriteCauses: CauseCategory[];
  donationFrequency: 'first-time' | 'occasional' | 'regular' | 'champion';
  averageDonation: number;
  monthlyDonations: number;
}

export interface ImpactStory {
  narrative: string;
  visualSuggestion: string;
  shareableQuote: string;
  followUpStory?: string;
  emotionalTone: 'hopeful' | 'urgent' | 'grateful' | 'inspiring';
}

export interface ImpactMetric {
  icon: string;
  label: string;
  value: string;
  description: string;
}

export interface MonthlyReport {
  headline: string;
  story: string;
  impactMetrics: ImpactMetric[];
  comparisonToOthers: string;
  suggestedNextAction: string;
  achievements: string[];
  topCause: CauseCategory;
  totalImpact: string;
}

export interface FollowUpStory {
  donationId: string;
  scheduledFor: number;
  delivered: boolean;
  story: string;
  updateType: 'one-week' | 'one-month' | 'three-month';
}

// RAG Chat Types
export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

export interface ChatContext {
  articleTitle: string;
  articleText: string;
  articleSummary: string;
  articleUrl?: string;
  classification: {
    cause: string;
    geoName: string;
    severity: string;
    identified_needs: string[];
    affectedGroups: string[];
  };
  matchedCharities: Array<{
    name: string;
    description: string;
    trustScore: number;
  }>;
}

export interface ChatRequest {
  message: string;
  context: ChatContext;
  history: ChatMessage[];
  enableWebSearch?: boolean;
}

export interface ChatResponse {
  message: string;
  suggestions?: string[];
  sources?: Array<{
    title: string;
    url: string;
  }>;
}