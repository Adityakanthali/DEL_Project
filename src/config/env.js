/**
 * Environment Configuration Loader
 * Validates and exposes system environment variables with safe fallbacks.
 */

import dotenv from 'dotenv';
dotenv.config();

export const ENV = {
  PORT: parseInt(process.env.PORT || '3000', 10),
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PROD: process.env.NODE_ENV === 'production',

  // Session
  SESSION_SECRET: process.env.SESSION_SECRET || 'gov_scheme_session_secret_key_change_in_production_2026_xyz',
  COOKIE_SECURE: process.env.COOKIE_SECURE === 'true',

  // MySQL Database
  DB: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'government_scheme_db',
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10', 10),
  },

  // Security
  BCRYPT_SALT_ROUNDS: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
};
