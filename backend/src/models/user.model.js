import mongoose from 'mongoose';

import { AUTH_PROVIDER } from '../constants/authProvider.js';
import { ACCOUNT_STATUS } from '../constants/accountStatus.js';
import { ROLE } from '../constants/role.js';

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [100, 'Full name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address'],
    },
    // Optional: OAuth users (e.g. Google) do not have a local password.
    // Hidden by default; must be explicitly selected when needed.
    password: {
      type: String,
      select: false,
    },
    authProvider: {
      type: String,
      enum: Object.values(AUTH_PROVIDER),
      default: AUTH_PROVIDER.LOCAL,
      required: true,
    },
    // Identifier issued by the external OAuth provider.
    providerId: {
      type: String,
      default: null,
    },
    profilePicture: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    accountStatus: {
      type: String,
      enum: Object.values(ACCOUNT_STATUS),
      default: ACCOUNT_STATUS.ACTIVE,
    },
    role: {
      type: String,
      enum: Object.values(ROLE),
      default: ROLE.USER,
      required: true,
    },
    // Set to now+1h on local registration; unset on verification.
    // The TTL index below deletes the document once this date passes.
    // Verified users always have this field unset and are never affected.
    unverifiedExpiresAt: {
      type: Date,
      default: null,
    },
    // Monotonically incrementing counter embedded as a `ver` claim in every
    // verification JWT. Incrementing it (on resend) makes all older tokens
    // invalid without needing a blacklist.
    emailVerificationVersion: {
      type: Number,
      default: 0,
    },
    // Timestamp of the last verification email dispatch; used to enforce the
    // 1-minute resend cooldown. Cleared after successful verification.
    verificationEmailLastSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// The provider id identifies an account on its own, so it is what Google sign-in
// matches on first. Only accounts linked to a provider are indexed, and the
// unique constraint keeps one external identity from reaching two accounts.
userSchema.index(
  { providerId: 1 },
  { unique: true, partialFilterExpression: { providerId: { $type: 'string' } } }
);

// TTL index for automatic unverified-account cleanup.
// MongoDB deletes documents once `unverifiedExpiresAt` is in the past.
// `expireAfterSeconds: 0` means the TTL daemon fires at the exact expiry time
// (within its ~60-second polling interval).
// The partial filter restricts the index to documents that actually have the
// field set, so verified users (where the field is null/unset) are never scanned.
userSchema.index(
  { unverifiedExpiresAt: 1 },
  {
    expireAfterSeconds: 0,
    partialFilterExpression: { unverifiedExpiresAt: { $type: 'date' } },
  }
);

const User = mongoose.model('User', userSchema);

export default User;
