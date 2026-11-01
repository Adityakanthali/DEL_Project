/**
 * User Model
 * Data access layer for citizen users table with parameterized queries.
 */

import { query } from '../config/db.js';

export async function findByEmail(email) {
  const sql = `
    SELECT
      user_id, full_name, email, password_hash,
      date_of_birth, state, district, occupation,
      annual_income, education_level, beneficiary_group,
      is_active, created_at, updated_at
    FROM users
    WHERE email = ?
    LIMIT 1
  `;
  const rows = await query(sql, [email.toLowerCase().trim()]);
  return rows[0] || null;
}

export async function findById(userId) {
  const sql = `
    SELECT
      user_id, full_name, email,
      date_of_birth, state, district, occupation,
      annual_income, education_level, beneficiary_group,
      is_active, created_at, updated_at
    FROM users
    WHERE user_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [userId]);
  return rows[0] || null;
}

export async function createUser({ fullName, email, passwordHash }) {
  const sql = `
    INSERT INTO users (full_name, email, password_hash)
    VALUES (?, ?, ?)
  `;
  const result = await query(sql, [
    fullName.trim(),
    email.toLowerCase().trim(),
    passwordHash,
  ]);
  return result.insertId;
}

export async function updateProfile(userId, profile) {
  const sql = `
    UPDATE users
    SET
      full_name = COALESCE(?, full_name),
      date_of_birth = ?,
      state = ?,
      district = ?,
      occupation = ?,
      annual_income = ?,
      education_level = ?,
      beneficiary_group = ?
    WHERE user_id = ?
  `;
  const params = [
    profile.full_name ? profile.full_name.trim() : null,
    profile.date_of_birth || null,
    profile.state || null,
    profile.district || null,
    profile.occupation || null,
    profile.annual_income !== undefined && profile.annual_income !== '' ? Number(profile.annual_income) : null,
    profile.education_level || null,
    profile.beneficiary_group || null,
    userId,
  ];

  await query(sql, params);
  return findById(userId);
}

export async function countUsers() {
  const sql = `SELECT COUNT(*) AS total FROM users WHERE is_active = 1`;
  const rows = await query(sql);
  return rows[0].total || 0;
}
