/**
 * Category Model
 * Lookups and administrative management for scheme categories.
 */

import { query } from '../config/db.js';

export async function getAllCategories() {
  const sql = `
    SELECT
      c.category_id,
      c.category_name,
      c.description,
      c.created_at,
      COUNT(s.scheme_id) AS total_schemes,
      SUM(CASE WHEN s.publication_status = 'published' THEN 1 ELSE 0 END) AS published_schemes
    FROM categories c
    LEFT JOIN schemes s ON c.category_id = s.category_id
    GROUP BY c.category_id, c.category_name, c.description, c.created_at
    ORDER BY c.category_name ASC
  `;
  return await query(sql);
}

export async function getCategoryById(id) {
  const sql = `
    SELECT category_id, category_name, description, created_at
    FROM categories
    WHERE category_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [id]);
  return rows[0] || null;
}

export async function createCategory({ category_name, description }) {
  const sql = `
    INSERT INTO categories (category_name, description)
    VALUES (?, ?)
  `;
  const result = await query(sql, [category_name.trim(), description ? description.trim() : null]);
  return result.insertId;
}

export async function updateCategory(id, { category_name, description }) {
  const sql = `
    UPDATE categories
    SET category_name = ?, description = ?
    WHERE category_id = ?
  `;
  await query(sql, [category_name.trim(), description ? description.trim() : null, id]);
  return getCategoryById(id);
}

export async function getSchemeCountForCategory(id) {
  const sql = `SELECT COUNT(*) AS total FROM schemes WHERE category_id = ?`;
  const rows = await query(sql, [id]);
  return rows[0].total || 0;
}

export async function deleteCategory(id) {
  const sql = `DELETE FROM categories WHERE category_id = ?`;
  const result = await query(sql, [id]);
  return result.affectedRows > 0;
}
