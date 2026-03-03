import mongoose, { Schema, Document } from 'mongoose';

/**
 * Enriched Organization Data
 * Combines Every.org base data with enrichment from IRS, ProPublica, and other sources
 * Tracks the source of each enriched field for debugging and validation
 */

export interface IClassification {
  nteeCode: string; // e.g., "R20"
  majorGroup: string; // e.g., "R"
  description: string; // e.g., "Civil Rights, Social Action & Advocacy"
  source: 'IRS_BMF' | 'PROPUBLICA' | 'CHARITY_NAVIGATOR' | 'MANUAL';
  confidence?: number; // 0-1 score if from semantic matching
}

export interface IFinancials {
  revenue?: number;
  assets?: number;
  expenses?: number;
  fiscalYear: number;
  source: 'IRS_BMF' | 'PROPUBLICA';
  lastUpdated: Date;
}

export interface ILocation {
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  source: 'IRS_BMF' | 'PROPUBLICA' | 'GOOGLE_PLACES';
}

export interface IRating {
  score: number; // 0-100
  stars: number; // 0-4
  source: 'CHARITY_NAVIGATOR';
  lastUpdated: Date;
}

export interface IEnrichmentMetadata {
  isEnriched: boolean;
  enrichmentStatus: 'pending' | 'partial' | 'complete' | 'failed';
  lastEnrichedAt: Date;
  enrichmentVersion: number; // Increment when enrichment logic changes
  sourcesUsed: string[]; // ['IRS_BMF', 'PROPUBLICA']
  errorLog?: Array<{
    source: string;
    error: string;
    timestamp: Date;
  }>;
  nextEnrichmentDue?: Date; // For stale-while-revalidate
}

export interface IEnrichedOrganization extends Document {
  // Core Identity (from Every.org)
  ein: string; // Normalized (no hyphens)
  everyOrgSlug: string;
  everyOrgId: string;
  name: string; // Display name from Every.org (better UX)
  description?: string;
  
  // Enriched Data
  classification?: IClassification;
  financials?: IFinancials;
  location?: ILocation;
  rating?: IRating;
  
  // Additional enrichment
  mission?: string;
  websiteUrl?: string;
  programs?: string[];
  
  // Metadata
  metadata: IEnrichmentMetadata;
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

const ClassificationSchema = new Schema<IClassification>(
  {
    nteeCode: { type: String, required: true },
    majorGroup: { type: String, required: true },
    description: { type: String, required: true },
    source: {
      type: String,
      required: true,
      enum: ['IRS_BMF', 'PROPUBLICA', 'CHARITY_NAVIGATOR', 'MANUAL'],
    },
    confidence: { type: Number, min: 0, max: 1 },
  },
  { _id: false }
);

const FinancialsSchema = new Schema<IFinancials>(
  {
    revenue: Number,
    assets: Number,
    expenses: Number,
    fiscalYear: { type: Number, required: true },
    source: {
      type: String,
      required: true,
      enum: ['IRS_BMF', 'PROPUBLICA'],
    },
    lastUpdated: { type: Date, required: true },
  },
  { _id: false }
);

const LocationSchema = new Schema<ILocation>(
  {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number,
    },
    source: {
      type: String,
      required: true,
      enum: ['IRS_BMF', 'PROPUBLICA', 'GOOGLE_PLACES'],
    },
  },
  { _id: false }
);

const RatingSchema = new Schema<IRating>(
  {
    score: { type: Number, required: true, min: 0, max: 100 },
    stars: { type: Number, required: true, min: 0, max: 4 },
    source: {
      type: String,
      required: true,
      enum: ['CHARITY_NAVIGATOR'],
    },
    lastUpdated: { type: Date, required: true },
  },
  { _id: false }
);

const EnrichmentMetadataSchema = new Schema<IEnrichmentMetadata>(
  {
    isEnriched: { type: Boolean, default: false },
    enrichmentStatus: {
      type: String,
      enum: ['pending', 'partial', 'complete', 'failed'],
      default: 'pending',
    },
    lastEnrichedAt: { type: Date, default: Date.now },
    enrichmentVersion: { type: Number, default: 1 },
    sourcesUsed: [{ type: String }],
    errorLog: [
      {
        source: String,
        error: String,
        timestamp: Date,
      },
    ],
    nextEnrichmentDue: Date,
  },
  { _id: false }
);

const EnrichedOrganizationSchema = new Schema<IEnrichedOrganization>(
  {
    ein: {
      type: String,
      required: true,
      unique: true,
      index: true,
      validate: {
        validator: (v: string) => /^\d{9}$/.test(v),
        message: 'EIN must be exactly 9 digits',
      },
    },
    everyOrgSlug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    everyOrgId: {
      type: String,
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    description: String,
    
    classification: ClassificationSchema,
    financials: FinancialsSchema,
    location: LocationSchema,
    rating: RatingSchema,
    
    mission: String,
    websiteUrl: String,
    programs: [String],
    
    metadata: {
      type: EnrichmentMetadataSchema,
      required: true,
      default: () => ({
        isEnriched: false,
        enrichmentStatus: 'pending',
        lastEnrichedAt: new Date(),
        enrichmentVersion: 1,
        sourcesUsed: [],
      }),
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
EnrichedOrganizationSchema.index({ 'classification.nteeCode': 1, 'location.state': 1 });
EnrichedOrganizationSchema.index({ 'classification.majorGroup': 1, 'location.city': 1 });
EnrichedOrganizationSchema.index({ 'metadata.enrichmentStatus': 1, 'metadata.lastEnrichedAt': 1 });
EnrichedOrganizationSchema.index({ 'metadata.nextEnrichmentDue': 1 }); // For background refresh
EnrichedOrganizationSchema.index({ name: 'text', description: 'text' }); // Text search

// Virtual for checking if enrichment is stale (>30 days)
EnrichedOrganizationSchema.virtual('isStale').get(function (this: IEnrichedOrganization) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.metadata.lastEnrichedAt < thirtyDaysAgo;
});

// Method to check if ready for re-enrichment
EnrichedOrganizationSchema.methods.needsEnrichment = function (this: IEnrichedOrganization): boolean {
  // If never enriched or failed, needs enrichment
  if (!this.metadata.isEnriched || this.metadata.enrichmentStatus === 'failed') {
    return true;
  }
  
  // If nextEnrichmentDue is set and passed, needs enrichment
  if (this.metadata.nextEnrichmentDue && this.metadata.nextEnrichmentDue < new Date()) {
    return true;
  }
  
  // If older than 30 days, needs enrichment
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return this.metadata.lastEnrichedAt < thirtyDaysAgo;
};

export default mongoose.model<IEnrichedOrganization>(
  'EnrichedOrganization',
  EnrichedOrganizationSchema
);