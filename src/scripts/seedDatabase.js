/**
 * Database Setup and Seeder Script
 * Automatically sets up MySQL database, executes schema scripts,
 * and seeds demo data with real bcrypt hashed passwords.
 *
 * Usage: node src/scripts/seedDatabase.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { ENV } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbFolder = path.join(__dirname, '..', '..', 'database');

async function runSeed() {
  console.log('Starting automated database initialization...');

  // Step 1: Connect to MySQL server without database selected to create db if needed
  const rootConn = await mysql.createConnection({
    host: ENV.DB.host,
    port: ENV.DB.port,
    user: ENV.DB.user,
    password: ENV.DB.password,
    multipleStatements: true,
  });

  try {
    console.log(`1. Ensuring database "${ENV.DB.database}" exists...`);
    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${ENV.DB.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.query(`USE \`${ENV.DB.database}\`;`);
    console.log('   Database confirmed.');

    // Step 2: Read and execute scripts sequentially
    const scripts = [
      '02_create_tables.sql',
      '03_constraints_indexes.sql',
      '04_sample_data.sql',
      '05_views.sql',
      '06_procedures_functions.sql',
      '07_cursor_demo.sql',
      '08_triggers.sql',
    ];

    for (const file of scripts) {
      const filePath = path.join(dbFolder, file);
      if (fs.existsSync(filePath)) {
        console.log(`2. Executing ${file}...`);
        const sqlContent = fs.readFileSync(filePath, 'utf8');

        // Handle DELIMITER // in stored programs and triggers
        const cleanedSql = sqlContent
          .replace(/DELIMITER \/\//g, '')
          .replace(/DELIMITER ;/g, '')
          .replace(/\/\//g, ';');

        try {
          await rootConn.query(cleanedSql);
          console.log(`   ✅ ${file} applied successfully.`);
        } catch (err) {
          console.warn(`   ⚠️ Warning in ${file}: ${err.message}`);
        }
      }
    }

    // Step 3: Update admin and citizen password hashes with real bcrypt hashes
    console.log('3. Updating bcrypt password hashes for demo accounts...');
    const adminHash = await bcrypt.hash('Admin@123', ENV.BCRYPT_SALT_ROUNDS);
    const citizenHash = await bcrypt.hash('Citizen@123', ENV.BCRYPT_SALT_ROUNDS);

    await rootConn.query(
      `UPDATE admins SET password_hash = ? WHERE email IN ('admin@govscheme.in', 'officer.sharma@govscheme.in')`,
      [adminHash]
    );

    await rootConn.query(
      `UPDATE users SET password_hash = ? WHERE email IN ('rahul.sharma@example.com', 'priya.patel@example.com', 'anita.deshmukh@example.com', 'vikram.singh@example.com')`,
      [citizenHash]
    );

    console.log('   ✅ Demo password hashes updated:');
    console.log('      Admin:   admin@govscheme.in   | Admin@123');
    console.log('      Citizen: rahul.sharma@example.com | Citizen@123');
    console.log('Database initialization completed successfully!');
  } finally {
    await rootConn.end();
  }
}

runSeed().catch((err) => {
  console.error('Database initialization failed:', err.message);
  process.exit(1);
});
