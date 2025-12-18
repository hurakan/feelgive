import mongoose, { Schema, Document } from 'mongoose';

export interface IClassification extends Document {
  cause: string;
  tier1_crisis_type: string;
  tier2_root_cause: string;
  identified_needs: string[];
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
    level: string;
    deathToll?: number;
    peopleAffected?: number;
    systemStatus: string;
    imminentRisk: boolean;
    reasoning: string;
  };
  userId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ClassificationSchema: Schema = new Schema(
  {
    cause: {
      type: String,
      required: true,
      enum: ['disaster_relief', 'health_crisis', 'climate_events', 'humanitarian_crisis', 'social_justice'],
      index: true,
    },
    tier1_crisis_type: {
      type: String,
      required: true,
      enum: ['natural_disaster', 'health_emergency', 'conflict_displacement', 'climate_disaster', 'human_rights_violation', 'none'],
    },
    tier2_root_cause: {
      type: String,
      required: true,
      enum: ['climate_driven', 'conflict_driven', 'poverty_driven', 'policy_driven', 'natural_phenomenon', 'systemic_inequality', 'multiple_factors', 'unknown'],
    },
    identified_needs: [{
      type: String,
      enum: ['food', 'shelter', 'medical', 'water', 'legal_aid', 'rescue', 'education', 'mental_health', 'winterization', 'sanitation'],
    }],
    geo: {
      type: String,
      required: true,
      index: true,
    },
    geoName: {
      type: String,
      required: true,
    },
    affectedGroups: [{
      type: String,
    }],
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },
    articleTitle: {
      type: String,
    },
    articleUrl: {
      type: String,
      index: true,
    },
    matchedKeywords: [{
      type: String,
    }],
    relevantExcerpts: [{
      type: String,
    }],
    hasMatchingCharities: {
      type: Boolean,
      default: false,
    },
    detectedThemes: [{
      type: String,
    }],
    severityAssessment: {
      level: {
        type: String,
        enum: ['extreme', 'high', 'moderate', 'low'],
        required: true,
      },
      deathToll: Number,
      peopleAffected: Number,
      systemStatus: {
        type: String,
        enum: ['collapsed', 'overwhelmed', 'strained', 'coping', 'normal'],
        required: true,
      },
      imminentRisk: {
        type: Boolean,
        required: true,
      },
      reasoning: {
        type: String,
        required: true,
      },
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
ClassificationSchema.index({ createdAt: -1 });
ClassificationSchema.index({ cause: 1, geo: 1 });
ClassificationSchema.index({ articleUrl: 1 }, { unique: true, sparse: true });

export default mongoose.model<IClassification>('Classification', ClassificationSchema);