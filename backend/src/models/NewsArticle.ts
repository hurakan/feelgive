import mongoose, { Schema, Document } from 'mongoose';

export interface INewsArticle extends Document {
  title: string;
  description: string;
  url: string;
  imageUrl?: string;
  source: string;
  apiSource: string; // Which API provided this article
  publishedAt: Date;
  fetchedAt: Date;
  content?: string; // Full article content if scraped
  author?: string;
  category?: string;
  country?: string;
  language?: string;
  keywords: string[];
  disasterType?: string;
  affectedCountry?: string;
  affectedRegion?: string;
  classificationStatus: 'pending' | 'classified' | 'irrelevant';
  classificationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NewsArticleSchema: Schema = new Schema(
  {
    title: {
      type: String,
      required: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    url: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    imageUrl: {
      type: String,
    },
    source: {
      type: String,
      required: true,
      index: true,
    },
    apiSource: {
      type: String,
      required: true,
      enum: ['newsapi', 'newsdata', 'currents', 'guardian', 'mediastack', 'gnews'],
      index: true,
    },
    publishedAt: {
      type: Date,
      required: true,
      index: true,
    },
    fetchedAt: {
      type: Date,
      required: true,
      default: Date.now,
    },
    content: {
      type: String,
    },
    author: {
      type: String,
    },
    category: {
      type: String,
      index: true,
    },
    country: {
      type: String,
      index: true,
    },
    language: {
      type: String,
      default: 'en',
    },
    keywords: [{
      type: String,
    }],
    disasterType: {
      type: String,
      enum: ['earthquake', 'flood', 'hurricane', 'wildfire', 'tsunami', 'drought', 'refugee', 'conflict', 'health_crisis', 'other'],
      index: true,
    },
    affectedCountry: {
      type: String,
      index: true,
    },
    affectedRegion: {
      type: String,
    },
    classificationStatus: {
      type: String,
      enum: ['pending', 'classified', 'irrelevant'],
      default: 'pending',
      index: true,
    },
    classificationId: {
      type: Schema.Types.ObjectId,
      ref: 'Classification',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
NewsArticleSchema.index({ publishedAt: -1 });
NewsArticleSchema.index({ apiSource: 1, fetchedAt: -1 });
NewsArticleSchema.index({ classificationStatus: 1, publishedAt: -1 });
NewsArticleSchema.index({ disasterType: 1, affectedCountry: 1 });
NewsArticleSchema.index({ keywords: 1 });

export default mongoose.model<INewsArticle>('NewsArticle', NewsArticleSchema);