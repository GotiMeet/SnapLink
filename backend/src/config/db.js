/**
 * @fileoverview Database connection module.
 *
 * BUSINESS PURPOSE:
 * Establishes the Mongoose connection to MongoDB. The application cannot serve
 * requests without persistence, so a failed connection is treated as fatal.
 *
 * @module config/db
 */
import mongoose from 'mongoose';

import config from './env.js';

/**
 * Connects to MongoDB using the configured connection URI.
 * @function connectDB
 */
const connectDB = async () => {
  try {
    const connection = await mongoose.connect(config.mongoUri);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    // An unavailable database at startup is unrecoverable, so exit rather than serve.
    console.error(`MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
