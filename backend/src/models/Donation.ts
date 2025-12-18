import mongoose, { Schema, Document } from 'mongoose';

export interface IDonation extends Document {
  charityId: string;
  charityName: string;
  charitySlug: string;
  amount: number;
  cause: string;
  geo: string;
  geoName: string;
  articleUrl?: string;
  articleTitle?: string;
  userEmail?: string;
  userId?: mongoose.Types.ObjectId;
  status: 'pending' | 'completed' | 'failed';
  paymentProvider?: string;
  paymentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema: Schema = new Schema(
  {
    charityId: {
      type: String,
      required: true,
      index: true,
    },
    charityName: {
      type: String,
      required: true,
    },
    charitySlug: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    cause: {
      type: String,
      required: true,
      enum: ['disaster_relief', 'health_crisis', 'climate_events', 'humanitarian_crisis', 'social_justice'],
      index: true,
    },
    geo: {
      type: String,
      required: true,
      index: true,
    },
    geoName: {
      type: String,
      required: true,
    },
    articleUrl: {
      type: String,
    },
    articleTitle: {
      type: String,
    },
    userEmail: {
      type: String,
      lowercase: true,
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'completed',
      index: true,
    },
    paymentProvider: {
      type: String,
      enum: ['every_org', 'stripe', 'mock'],
    },
    paymentId: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for common queries
DonationSchema.index({ createdAt: -1 });
DonationSchema.index({ userId: 1, createdAt: -1 });
DonationSchema.index({ cause: 1, createdAt: -1 });
DonationSchema.index({ geo: 1, createdAt: -1 });

export default mongoose.model<IDonation>('Donation', DonationSchema);