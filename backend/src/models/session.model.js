import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
      index: true,
    },
    // SHA-256 hash of the refresh token; the raw token is never stored.
    hashedRefreshToken: {
      type: String,
      required: [true, 'Hashed refresh token is required'],
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiry is required'],
    },
    userAgent: {
      type: String,
      default: null,
    },
    // Hashed client IP; the raw address is never stored.
    hashedIpAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const Session = mongoose.model('Session', sessionSchema);

export default Session;
