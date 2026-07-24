import dotenv from 'dotenv';

dotenv.config();

const requiredEnvVars = ['MONGO_URI'];

const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required environment variables: ${missingEnvVars.join(', ')}`
  );
}

const config = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: '/api/v1',
  mongoUri: process.env.MONGO_URI,
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

export default config;
