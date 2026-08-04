import mongoose from 'mongoose';

import { URL_STATUS } from '../constants/status.js';
import { VISIBILITY } from '../constants/visibility.js';

const shortUrlSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project is required'],
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Owner is required'],
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
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
    // Only set for private links, stored as a bcrypt hash.
    // Hidden by default; must be explicitly selected when verifying access.
    password: {
      type: String,
      select: false,
    },
    status: {
      type: String,
      enum: Object.values(URL_STATUS),
      default: URL_STATUS.ACTIVE,
    },
    // Scheduling markers are stored only; the milestone that acts on them adds
    // the background job that flips a link live or removes it.
    scheduledLiveAt: {
      type: Date,
      default: null,
    },
    scheduledDeleteAt: {
      type: Date,
      default: null,
    },
    // Set when the URL is soft-deleted; null while active.
    deletedAt: {
      type: Date,
      default: null,
    },
    // Visit totals are not stored here: the analytics collection aggregates them
    // per day and is the only record of how often a link was used.
    lastAccessedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Supports the dashboard and recycle-bin listings, which select a user's links by
// status and show the most recently updated first.
shortUrlSchema.index({ owner: 1, status: 1, updatedAt: -1 });

// Supports listing a single project's links and the status propagation that runs
// when a project is deleted or restored.
shortUrlSchema.index({ project: 1, status: 1, updatedAt: -1 });

const ShortUrl = mongoose.model('ShortUrl', shortUrlSchema);

export default ShortUrl;
