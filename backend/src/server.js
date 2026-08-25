/**
 * @fileoverview Server entry point and process lifecycle manager.
 *
 * BUSINESS PURPOSE:
 * Brings the system online: connects to the database, binds the Express app to a
 * port, and coordinates graceful shutdown on termination signals.
 *
 * SEPARATION OF CONCERNS (WHY):
 * Isolating these side effects here keeps app.js importable for testing without
 * opening a port or a database connection.
 *
 * @module server
 */
import app from './app.js';
import config from './config/env.js';
import connectDB from './config/db.js';
import {
  startScheduler,
  stopScheduler,
} from './services/urlScheduler.service.js';

/**
 * Connects the database, then starts the HTTP server and wires shutdown handlers.
 * @function startServer
 */
const startServer = async () => {
  // Establish persistence before accepting traffic so no request runs without a DB.
  await connectDB();

  // Start background URL scheduling worker for automated activation and soft deletion.
  startScheduler();

  const server = app.listen(config.port, () => {
    console.log(
      `Server running in ${config.nodeEnv} mode on port ${config.port}`
    );
  });

  // Close the server on termination signals so in-flight requests can drain.
  const shutdown = (signal) => {
    console.log(`${signal} received. Shutting down gracefully...`);
    stopScheduler();
    server.close(() => {
      console.log('Server closed.');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
};

startServer();
