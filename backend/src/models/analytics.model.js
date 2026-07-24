import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
  shortUrl: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ShortUrl',
    required: [true, 'Short URL reference is required'],
  },
  browser: {
    type: String,
    trim: true,
  },
  operatingSystem: {
    type: String,
    trim: true,
  },
  deviceType: {
    type: String,
    trim: true,
  },
  referrer: {
    type: String,
    trim: true,
    default: null,
  },
  country: {
    type: String,
    trim: true,
    default: null,
  },
  // Store only a hashed IP address; raw IP addresses are never persisted.
  hashedIpAddress: {
    type: String,
  },
  clickedAt: {
    type: Date,
    default: Date.now,
  },
});

// Supports time-ordered analytics queries for a given short URL.
analyticsSchema.index({ shortUrl: 1, clickedAt: -1 });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
