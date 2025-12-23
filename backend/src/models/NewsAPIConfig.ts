import mongoose, { Schema, Document } from 'mongoose';

export interface INewsAPIConfig extends Document {
  name: string;
  apiKey: string;
  provider: 'newsapi' | 'newsdata' | 'currents' | 'guardian' | 'mediastack' | 'gnews';
  isEnabled: boolean;
  priority: number; // Higher priority sources are queried first
  rateLimit: {
    requestsPerDay: number;
    requestsPerHour?: number;
    currentDayUsage: number;
    currentHourUsage: number;
    lastResetDate: Date;
    lastResetHour: Date;
  };
  endpoints: {
    topHeadlines?: string;
    everything?: string;
    sources?: string;
  };
  supportedFeatures: {
    topHeadlines: boolean;
    searchByKeyword: boolean;
    searchByCountry: boolean;
    searchByCategory: boolean;
    fullTextSearch: boolean;
  };
  keywords: string[]; // Crisis-related keywords to search for
  countries: string[]; // Countries to monitor
  categories: string[]; // News categories to fetch
  lastFetchedAt?: Date;
  lastSuccessfulFetch?: Date;
  lastError?: string;
  totalArticlesFetched: number;
  createdAt: Date;
  updatedAt: Date;
}

const NewsAPIConfigSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    apiKey: {
      type: String,
      required: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['newsapi', 'newsdata', 'currents', 'guardian', 'mediastack', 'gnews'],
      unique: true,
    },
    isEnabled: {
      type: Boolean,
      default: true,
      index: true,
    },
    priority: {
      type: Number,
      default: 5,
      min: 1,
      max: 10,
    },
    rateLimit: {
      requestsPerDay: {
        type: Number,
        required: true,
      },
      requestsPerHour: {
        type: Number,
      },
      currentDayUsage: {
        type: Number,
        default: 0,
      },
      currentHourUsage: {
        type: Number,
        default: 0,
      },
      lastResetDate: {
        type: Date,
        default: Date.now,
      },
      lastResetHour: {
        type: Date,
        default: Date.now,
      },
    },
    endpoints: {
      topHeadlines: String,
      everything: String,
      sources: String,
    },
    supportedFeatures: {
      topHeadlines: {
        type: Boolean,
        default: true,
      },
      searchByKeyword: {
        type: Boolean,
        default: true,
      },
      searchByCountry: {
        type: Boolean,
        default: false,
      },
      searchByCategory: {
        type: Boolean,
        default: false,
      },
      fullTextSearch: {
        type: Boolean,
        default: false,
      },
    },
    keywords: [{
      type: String,
    }],
    countries: [{
      type: String,
    }],
    categories: [{
      type: String,
    }],
    lastFetchedAt: {
      type: Date,
    },
    lastSuccessfulFetch: {
      type: Date,
    },
    lastError: {
      type: String,
    },
    totalArticlesFetched: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
NewsAPIConfigSchema.index({ provider: 1 });
NewsAPIConfigSchema.index({ isEnabled: 1, priority: -1 });

export default mongoose.model<INewsAPIConfig>('NewsAPIConfig', NewsAPIConfigSchema);