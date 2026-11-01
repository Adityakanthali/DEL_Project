/**
 * Admin Model
 * Data access layer for administrators table with parameterized queries.
 */

import { query } from '../config/db.js';

export async function findByEmail(email) {
  const sql = `
    SELECT admin_id, full_name, email, password_hash, role, is_active, created_at
    FROM admins
    WHERE email = ?
    LIMIT 1
  `;
  const rows = await query(sql, [email.toLowerCase().trim()]);
  return rows[0] || null;
}

export async function findById(adminId) {
  const sql = `
    SELECT admin_id, full_name, email, role, is_active, created_at
    FROM admins
    WHERE admin_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [adminId]);
  return rows[0] || null;
}

export async function createAdmin({ fullName, email, passwordHash, role = 'admin' }) {
  const sql = `
    INSERT INTO admins (full_name, email, password_hash, role)
    VALUES (?, ?, ?, ?)
  `;
  const result = await query(sql, [
    fullName.trim(),
    email.toLowerCase().trim(),
    passwordHash,
    role,
  ]);
  return result.insertId;
}
