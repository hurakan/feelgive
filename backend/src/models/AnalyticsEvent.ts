import mongoose, { Schema, Document } from 'mongoose';

export interface IAnalyticsEvent extends Document {
  sessionId: string;
  userId?: string; // Changed to string to accept UUIDs from frontend
  eventType: string; // e.g., 'page_view', 'donation_click', 'signup', 'error'
  eventName?: string; // e.g., 'Home Page', 'Charity A'
  category?: string; // e.g., 'navigation', 'conversion', 'interaction'
  metadata?: Map<string, any>; // Flexible payload for event details
  url: string;
  referrer?: string;
  timestamp: Date;
  country?: string; // Country name from IP geolocation
  city?: string; // City name from IP geolocation
  region?: string; // Region/state from IP geolocation
  timezone?: string; // User's timezone
  latitude?: number; // Latitude from IP geolocation
  longitude?: number; // Longitude from IP geolocation
  createdAt: Date;
}

const AnalyticsEventSchema: Schema = new Schema(
  {
    sessionId: { type: String, required: true, index: true },
    userId: { type: String, index: true }, // Changed to String to accept UUIDs
    eventType: { type: String, required: true, index: true },
    eventName: { type: String },
    category: { type: String, index: true },
    metadata: { type: Map, of: Schema.Types.Mixed },
    url: { type: String, required: true },
    referrer: { type: String },
    timestamp: { type: Date, default: Date.now, index: true },
    country: { type: String, index: true }, // Indexed for location-based queries
    city: { type: String },
    region: { type: String },
    timezone: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for common queries
AnalyticsEventSchema.index({ eventType: 1, timestamp: -1 });
AnalyticsEventSchema.index({ sessionId: 1, timestamp: 1 });

// Optional: TTL index for 1 year retention (31536000 seconds)
// Uncomment the line below to enable automatic deletion of events older than 1 year
// AnalyticsEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);