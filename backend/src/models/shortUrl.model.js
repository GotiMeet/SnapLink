import mongoose from 'mongoose';

import { URL_STATUS } from '../constants/status.js';
import { VISIBILITY } from '../constants/visibility.js';

const shortUrlSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    originalUrl: {
      type: String,
      required: [true, 'Original URL is required'],
      trim: true,
      maxlength: [2048, 'Original URL cannot exceed 2048 characters'],
      match: [/^https?:\/\/.+/i, 'Original URL must be a valid http or https URL'],
    },
    shortCode: {
      type: String,
      required: [true, 'Short code is required'],
      unique: true,
      trim: true,
      maxlength: [32, 'Short code cannot exceed 32 characters'],
      match: [
        /^[a-zA-Z0-9_-]+$/,
        'Short code may only contain letters, numbers, hyphens, and underscores',
      ],
    },
    isCustomAlias: {
      type: Boolean,
      default: false,
    },
    visibility: {
      type: String,
      enum: Object.values(VISIBILITY),
      default: VISIBILITY.PUBLIC,
    },
    status: {
      type: String,
      enum: Object.values(URL_STATUS),
      default: URL_STATUS.ACTIVE,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    // Set when the URL is soft-deleted; null while active.
    deletedAt: {
      type: Date,
      default: null,
    },
    clickCount: {
      type: Number,
      default: 0,
      min: [0, 'Click count cannot be negative'],
    },
    lastAccessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Supports the dashboard listing: a user's active URLs, most recent first.
shortUrlSchema.index(
  { owner: 1, createdAt: -1 },
  { partialFilterExpression: { deletedAt: null } }
);

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

export default ShortUrl;
