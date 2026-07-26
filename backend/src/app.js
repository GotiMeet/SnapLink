/**
 * @fileoverview Express application setup and middleware/route composition.
 *
 * BUSINESS PURPOSE:
 * Builds the configured Express app: global security/parsing middleware, the
 * versioned API router, and the terminal 404 + error handlers.
 *
 * SEPARATION OF CONCERNS (WHY):
 * This module only assembles the app and stays free of network binding and
 * database initialization (those live in server.js), so the app can be imported
 * into tests without side effects such as listening on a port.
 *
 * @module src/app
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import config from './config/env.js';
import apiRoutes from './routes/index.js';
import notFoundMiddleware from './middleware/notFound.middleware.js';
import errorMiddleware from './middleware/error.middleware.js';

const app = express();

// Security headers and CORS run first so they apply to every response.
app.use(helmet());
app.use(
  cors({
    origin: config.corsOrigin,
    credentials: true,
  })
);

// Request logging is noise in production, so it is limited to development.
if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(config.apiPrefix, apiRoutes);

// Unmatched routes fall through to the 404 handler, then the global error handler
// (registered last so it can catch errors from every preceding layer).
app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
