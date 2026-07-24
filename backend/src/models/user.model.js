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
  },
  {
    timestamps: true,
  }
);

// Speeds up OAuth sign-in lookups; only indexes accounts linked to a provider.
userSchema.index(
  { authProvider: 1, providerId: 1 },
  { partialFilterExpression: { providerId: { $type: 'string' } } }
);

const User = mongoose.model('User', userSchema);

export default User;
