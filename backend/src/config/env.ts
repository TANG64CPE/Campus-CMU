import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: process.env.PORT || '5000',
  NODE_ENV: process.env.NODE_ENV || 'development',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/campusmart?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'supersecret_cmu_campusmart_jwt_key_2026_dev',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CMU_OAUTH_CLIENT_ID: process.env.CMU_OAUTH_CLIENT_ID || '',
  CMU_OAUTH_CLIENT_SECRET: process.env.CMU_OAUTH_CLIENT_SECRET || '',
  CMU_OAUTH_REDIRECT_URI: process.env.CMU_OAUTH_REDIRECT_URI || 'http://localhost:5000/api/auth/cmu/callback',
  ENABLE_MOCK_AUTH: process.env.ENABLE_MOCK_AUTH !== 'false', // defaults to true for smooth local dev
};
