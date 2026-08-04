import mongoose from 'mongoose';

// Each counter map is created per path so the schema paths never share a default.
const countMap = () => ({
  type: Map,
  of: Number,
  default: () => new Map(),
});

const analyticsSchema = new mongoose.Schema(
  {
    url: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ShortUrl',
      required: [true, 'Short URL reference is required'],
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project reference is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    // Normalized to UTC midnight so a document covers exactly one calendar day.
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    clicks: {
      type: Number,
      default: 0,
      min: [0, 'Clicks cannot be negative'],
    },
    qrScans: {
      type: Number,
      default: 0,
      min: [0, 'QR scans cannot be negative'],
    },
    browserCounts: countMap(),
    osCounts: countMap(),
    deviceCounts: countMap(),
    referrerCounts: countMap(),
    languageCounts: countMap(),
  },
  {
    timestamps: true,
  }
);

// One document per link per day. The upsert matches on exactly this key, so the
// unique constraint is what keeps concurrent visits folding into one document.
analyticsSchema.index({ url: 1, date: 1 }, { unique: true });

const Analytics = mongoose.model('Analytics', analyticsSchema);

export default Analytics;
