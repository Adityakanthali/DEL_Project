/**
 * User Saved Schemes (Bookmarks) Model
 * Junction table between users and schemes.
 */

import { query } from '../config/db.js';

export async function saveScheme(userId, schemeId) {
  const sql = `
    INSERT INTO user_saved_schemes (user_id, scheme_id)
    VALUES (?, ?)
    ON DUPLICATE KEY UPDATE saved_at = CURRENT_TIMESTAMP
  `;
  await query(sql, [userId, schemeId]);
  return true;
}

export async function removeSavedScheme(userId, schemeId) {
  const sql = `
    DELETE FROM user_saved_schemes
    WHERE user_id = ? AND scheme_id = ?
  `;
  const result = await query(sql, [userId, schemeId]);
  return result.affectedRows > 0;
}

export async function isSchemeSavedByUser(userId, schemeId) {
  const sql = `
    SELECT 1 FROM user_saved_schemes
    WHERE user_id = ? AND scheme_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [userId, schemeId]);
  return rows.length > 0;
}

export async function getUserSavedSchemes(userId) {
  const sql = `
    SELECT
      uss.user_id,
      uss.scheme_id,
      s.scheme_name,
      s.short_description,
      s.benefits,
      s.category_id,
      c.category_name,
      s.start_date,
      s.end_date,
      s.applicable_scope,
      s.applicable_state,
      s.official_application_url,
      s.publication_status,
      CASE
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
      END AS application_status,
      uss.saved_at
    FROM user_saved_schemes uss
    INNER JOIN schemes s ON uss.scheme_id = s.scheme_id
    INNER JOIN categories c ON s.category_id = c.category_id
    WHERE uss.user_id = ?
      AND s.publication_status = 'published'
    ORDER BY uss.saved_at DESC
  `;
  return await query(sql, [userId]);
}
