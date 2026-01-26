import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsSession extends Document {
  sessionId: string;
  userId?: string; // Changed to string to accept UUIDs from frontend
  startTime: Date;
  lastActivity: Date;
  endTime?: Date;
  duration?: number; // in seconds
  deviceType: string; // 'mobile', 'desktop', 'tablet'
  browser: string;
  os: string;
  country?: string; // Country name from IP geolocation
  city?: string; // City name from IP geolocation
  region?: string; // Region/state from IP geolocation
  timezone?: string; // User's timezone
  latitude?: number; // Latitude from IP geolocation
  longitude?: number; // Longitude from IP geolocation
  pageViews: number;
  createdAt: Date;
  updatedAt: Date;
}

const AnalyticsSessionSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, unique: true },
    userId: { type: String, index: true }, // Changed to String to accept UUIDs
    startTime: { type: Date, default: Date.now, index: true },
    lastActivity: { type: Date, default: Date.now },
    endTime: { type: Date },
    duration: { type: Number },
    deviceType: { type: String },
    browser: { type: String },
    os: { type: String },
    country: { type: String, index: true }, // Indexed for location-based queries
    city: { type: String },
    region: { type: String },
    timezone: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    pageViews: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model<IAnalyticsSession>('AnalyticsSession', AnalyticsSessionSchema);