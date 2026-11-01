/**
 * MySQL Database Connection Pool
 * Uses mysql2/promise for modern async/await syntax and connection pooling.
 */

import mysql from 'mysql2/promise';
import { ENV } from './env.js';

let pool = null;

export function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: ENV.DB.host,
      port: ENV.DB.port,
      user: ENV.DB.user,
      password: ENV.DB.password,
      database: ENV.DB.database,
      waitForConnections: true,
      connectionLimit: ENV.DB.connectionLimit,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelay: 10000,
      dateStrings: true, // Keep DATE/DATETIME as strings to avoid UTC date offset issues
    });
  }
  return pool;
}

/**
 * Execute a parameterized query with error safety
 * @param {string} sql - SQL statement with ? placeholders
 * @param {Array} params - Array of parameter values
 */
export async function query(sql, params = []) {
  const connectionPool = getPool();
  const [rows] = await connectionPool.execute(sql, params);
  return rows;
}

/**
 * Test database connectivity
 * Returns true if connected, false otherwise
 */
export async function testConnection() {
  try {
    const connectionPool = getPool();
    const [result] = await connectionPool.query('SELECT 1 + 1 AS result');
    return result[0].result === 2;
  } catch (err) {
    console.error('Database connection test failed:', err.message);
    return false;
  }
}

export default {
  getPool,
  query,
  testConnection,
};
