import dotenv from 'dotenv';

dotenv.config();

const nodeEnv = process.env.NODE_ENV || 'development';
const port = Number(process.env.PORT) || 5000;
const isProduction = nodeEnv === 'production';

// Core environment variables required in all environments.
const baseRequiredEnvVars = [
  'MONGO_URI',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_EMAIL_VERIFICATION_SECRET',
  'JWT_PASSWORD_RESET_SECRET',
];

// In production, explicit public origins and SMTP credentials are required so that
// short links, CORS, and transactional emails do not fail or fall back to localhost.
const productionRequiredEnvVars = [
  'APP_URL',
  'CLIENT_URL',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

const requiredEnvVars = isProduction
  ? [...baseRequiredEnvVars, ...productionRequiredEnvVars]
  : baseRequiredEnvVars;

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]?.trim());

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables for ${nodeEnv} environment: ${missingEnvVars.join(', ')}`
  );
}

// In production, URLs must come strictly from environment variables without localhost fallbacks.
const clientUrl = (
  isProduction
    ? process.env.CLIENT_URL
    : process.env.CLIENT_URL || 'http://localhost:3000'
).replace(/\/+$/, '');

const appUrl = (
  isProduction
    ? process.env.APP_URL
    : process.env.APP_URL || `http://localhost:${port}`
).replace(/\/+$/, '');

const config = {
  port,
  nodeEnv,
  apiPrefix: '/api/v1',
  clientUrl,
  // Public origin short links resolve from, and therefore what a QR code encodes.
  // A trailing slash is trimmed so the code is always built the same way.
  appUrl,
  mongoUri: process.env.MONGO_URI,
  // Never a wildcard: the API answers credentialed requests, and browsers reject
  // "*" on those. Falling back to the client URL keeps the allowed origin exact.
  corsOrigin: process.env.CORS_ORIGIN || clientUrl,
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS) || 12,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    emailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET,
    passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET,
    // Time-to-live values are expressed in seconds and shared with cookie maxAge.
    accessTtl: Number(process.env.JWT_ACCESS_TTL) || 15 * 60,
    refreshTtl: Number(process.env.JWT_REFRESH_TTL) || 7 * 24 * 60 * 60,
    emailVerificationTtl: Number(process.env.JWT_EMAIL_VERIFICATION_TTL) || 15 * 60,
    passwordResetTtl: Number(process.env.JWT_PASSWORD_RESET_TTL) || 15 * 60,
  },
  cookie: {
    secure:
      process.env.COOKIE_SECURE !== undefined
        ? process.env.COOKIE_SECURE === 'true'
        : isProduction,
    // In production the browser and the API sit on separate sites, so the auth
    // cookies only travel if they are marked cross-site; "none" additionally
    // requires the secure flag above. Development stays on "lax", where the two
    // run on localhost and count as the same site.
    sameSite: process.env.COOKIE_SAME_SITE || (isProduction ? 'none' : 'lax'),
    domain: process.env.COOKIE_DOMAIN || undefined,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID || '',
  },
  email: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'SnapLink <no-reply@snaplink.local>',
  },
};

export default config;
