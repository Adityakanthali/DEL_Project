/**
 * Scheme Model
 * Data access layer for government schemes with parameterized queries,
 * dynamic application status calculation, search, and admin operations.
 */

import { query, getPool } from '../config/db.js';

/**
 * Retrieves paginated published schemes for the public citizen catalog
 */
export async function getPublishedSchemes({
  search = '',
  categoryId = null,
  state = '',
  occupation = '',
  status = '',
  minAge = null,
  maxIncome = null,
  sortBy = 'created_at',
  order = 'DESC',
  page = 1,
  limit = 9,
} = {}) {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));

  let whereClauses = [`s.publication_status = 'published'`];
  let params = [];

  // Search keyword in name, short description, description, benefits
  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    whereClauses.push(`(
      s.scheme_name LIKE ? OR
      s.short_description LIKE ? OR
      s.description LIKE ? OR
      s.benefits LIKE ?
    )`);
    params.push(term, term, term, term);
  }

  // Category filter
  if (categoryId && parseInt(categoryId, 10) > 0) {
    whereClauses.push(`s.category_id = ?`);
    params.push(parseInt(categoryId, 10));
  }

  // State filter (Schemes either National scope OR specific state)
  if (state && state.trim() !== '') {
    whereClauses.push(`(s.applicable_scope = 'National' OR s.applicable_state = ?)`);
    params.push(state.trim());
  }

  // Occupation filter
  if (occupation && occupation.trim() !== '') {
    whereClauses.push(`EXISTS (
      SELECT 1 FROM eligibility_criteria ec
      WHERE ec.scheme_id = s.scheme_id
        AND ec.criterion_type = 'occupation'
        AND ec.criterion_value LIKE ?
    )`);
    params.push(`%${occupation.trim()}%`);
  }

  // Age filter
  if (minAge !== null && minAge !== undefined && minAge !== '') {
    const userAge = Number(minAge);
    whereClauses.push(`NOT EXISTS (
      SELECT 1 FROM eligibility_criteria ec
      WHERE ec.scheme_id = s.scheme_id
        AND ec.is_mandatory = 1
        AND (
          (ec.criterion_type = 'min_age' AND CAST(ec.criterion_value AS UNSIGNED) > ?) OR
          (ec.criterion_type = 'max_age' AND CAST(ec.criterion_value AS UNSIGNED) < ?)
        )
    )`);
    params.push(userAge, userAge);
  }

  // Max income filter
  if (maxIncome !== null && maxIncome !== undefined && maxIncome !== '') {
    const userIncome = Number(maxIncome);
    whereClauses.push(`NOT EXISTS (
      SELECT 1 FROM eligibility_criteria ec
      WHERE ec.scheme_id = s.scheme_id
        AND ec.is_mandatory = 1
        AND ec.criterion_type = 'max_income'
        AND CAST(ec.criterion_value AS DECIMAL(12,2)) < ?
    )`);
    params.push(userIncome);
  }

  // Application status filter (Open, Upcoming, Closed)
  if (status) {
    const sNorm = status.toLowerCase();
    if (sNorm === 'open') {
      whereClauses.push(`CURDATE() >= s.start_date AND (s.end_date IS NULL OR CURDATE() <= s.end_date)`);
    } else if (sNorm === 'upcoming') {
      whereClauses.push(`CURDATE() < s.start_date`);
    } else if (sNorm === 'closed') {
      whereClauses.push(`s.end_date IS NOT NULL AND CURDATE() > s.end_date`);
    }
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  // Safe sorting allowlist
  const allowedSortCols = {
    name: 's.scheme_name',
    start_date: 's.start_date',
    end_date: 's.end_date',
    created_at: 's.created_at',
  };
  const sortCol = allowedSortCols[sortBy] || 's.created_at';
  const sortOrder = order.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

  // Count total matching
  const countSql = `
    SELECT COUNT(*) AS total
    FROM schemes s
    ${whereSql}
  `;
  const countRows = await query(countSql, params);
  const total = countRows[0].total || 0;

  // Retrieve records
  const selectSql = `
    SELECT
      s.scheme_id,
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
      s.official_source_url,
      s.source_last_verified_at,
      s.publication_status,
      CASE
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
      END AS application_status,
      DATEDIFF(s.end_date, CURDATE()) AS days_remaining,
      s.created_at
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    ${whereSql}
    ORDER BY ${sortCol} ${sortOrder}
    LIMIT ? OFFSET ?
  `;

  const queryParams = [...params, parsedLimit, offset];
  const schemes = await query(selectSql, queryParams);

  return {
    schemes,
    total,
    page: parseInt(page, 10),
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
  };
}

/**
 * Retrieve public scheme details by scheme_id (must be published)
 */
export async function getPublishedSchemeById(schemeId) {
  const sql = `
    SELECT
      s.scheme_id,
      s.scheme_name,
      s.short_description,
      s.description,
      s.benefits,
      s.category_id,
      c.category_name,
      s.start_date,
      s.end_date,
      s.applicable_scope,
      s.applicable_state,
      s.official_application_url,
      s.official_source_url,
      s.source_last_verified_at,
      s.publication_status,
      CASE
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
      END AS application_status,
      DATEDIFF(s.end_date, CURDATE()) AS days_remaining,
      s.created_at,
      s.updated_at
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    WHERE s.scheme_id = ? AND s.publication_status = 'published'
    LIMIT 1
  `;
  const rows = await query(sql, [schemeId]);
  return rows[0] || null;
}

/**
 * Retrieve featured schemes for public homepage
 */
export async function getFeaturedSchemes(limit = 4) {
  const sql = `
    SELECT
      s.scheme_id,
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
      CASE
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
      END AS application_status
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    WHERE s.publication_status = 'published'
    ORDER BY s.scheme_id ASC
    LIMIT ?
  `;
  return await query(sql, [limit]);
}

/**
 * Retrieve schemes closing soon (within 365 days)
 */
export async function getClosingSoonSchemes(limit = 4) {
  const sql = `
    SELECT
      s.scheme_id,
      s.scheme_name,
      s.short_description,
      s.category_id,
      c.category_name,
      s.end_date,
      DATEDIFF(s.end_date, CURDATE()) AS days_remaining,
      s.official_application_url,
      'Open' AS application_status
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    WHERE s.publication_status = 'published'
      AND s.end_date IS NOT NULL
      AND CURDATE() BETWEEN s.start_date AND s.end_date
    ORDER BY s.end_date ASC
    LIMIT ?
  `;
  return await query(sql, [limit]);
}

/**
 * Retrieve all schemes for admin with publication status filters
 */
export async function getAllSchemesAdmin({
  search = '',
  categoryId = null,
  status = '',
  limit = 20,
  page = 1,
} = {}) {
  const offset = (Math.max(1, parseInt(page, 10)) - 1) * Math.max(1, parseInt(limit, 10));
  const parsedLimit = Math.max(1, parseInt(limit, 10));

  let whereClauses = [];
  let params = [];

  if (search && search.trim() !== '') {
    const term = `%${search.trim()}%`;
    whereClauses.push(`(s.scheme_name LIKE ? OR s.short_description LIKE ?)`);
    params.push(term, term);
  }

  if (categoryId && parseInt(categoryId, 10) > 0) {
    whereClauses.push(`s.category_id = ?`);
    params.push(parseInt(categoryId, 10));
  }

  if (status && status.trim() !== '') {
    whereClauses.push(`s.publication_status = ?`);
    params.push(status.trim());
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countSql = `SELECT COUNT(*) AS total FROM schemes s ${whereSql}`;
  const countRows = await query(countSql, params);
  const total = countRows[0].total || 0;

  const selectSql = `
    SELECT
      s.scheme_id,
      s.scheme_name,
      s.short_description,
      s.category_id,
      c.category_name,
      s.start_date,
      s.end_date,
      s.applicable_scope,
      s.applicable_state,
      s.publication_status,
      CASE
        WHEN s.publication_status <> 'published' THEN CONCAT(UCASE(LEFT(s.publication_status, 1)), LCASE(SUBSTRING(s.publication_status, 2)))
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
      END AS calculated_status,
      a.full_name AS created_by_admin,
      s.created_at,
      s.updated_at
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN admins a ON s.created_by_admin_id = a.admin_id
    ${whereSql}
    ORDER BY s.scheme_id DESC
    LIMIT ? OFFSET ?
  `;

  const schemes = await query(selectSql, [...params, parsedLimit, offset]);

  return {
    schemes,
    total,
    page: parseInt(page, 10),
    limit: parsedLimit,
    totalPages: Math.ceil(total / parsedLimit) || 1,
  };
}

/**
 * Retrieve single scheme for admin view/edit (regardless of publication status)
 */
export async function getSchemeByIdAdmin(schemeId) {
  const sql = `
    SELECT
      s.scheme_id,
      s.scheme_name,
      s.short_description,
      s.description,
      s.benefits,
      s.category_id,
      c.category_name,
      s.start_date,
      s.end_date,
      s.applicable_scope,
      s.applicable_state,
      s.official_application_url,
      s.official_source_url,
      s.source_last_verified_at,
      s.publication_status,
      CASE
        WHEN s.publication_status <> 'published' THEN CONCAT(UCASE(LEFT(s.publication_status, 1)), LCASE(SUBSTRING(s.publication_status, 2)))
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
      END AS calculated_status,
      s.created_by_admin_id,
      a.full_name AS created_by_admin,
      s.created_at,
      s.updated_at
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN admins a ON s.created_by_admin_id = a.admin_id
    WHERE s.scheme_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [schemeId]);
  return rows[0] || null;
}

/**
 * Creates a new scheme record
 */
export async function createScheme(schemeData, connection = null) {
  const sql = `
    INSERT INTO schemes (
      scheme_name, short_description, description, benefits,
      category_id, start_date, end_date, applicable_scope, applicable_state,
      official_application_url, official_source_url, source_last_verified_at,
      publication_status, created_by_admin_id
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    schemeData.scheme_name.trim(),
    schemeData.short_description.trim(),
    schemeData.description.trim(),
    schemeData.benefits.trim(),
    schemeData.category_id,
    schemeData.start_date,
    schemeData.end_date || null,
    schemeData.applicable_scope || 'National',
    schemeData.applicable_state || null,
    schemeData.official_application_url || null,
    schemeData.official_source_url || null,
    schemeData.source_last_verified_at || null,
    schemeData.publication_status || 'draft',
    schemeData.created_by_admin_id || null,
  ];

  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result.insertId;
  }
  const result = await query(sql, params);
  return result.insertId;
}

/**
 * Updates an existing scheme record
 */
export async function updateScheme(schemeId, schemeData, connection = null) {
  const sql = `
    UPDATE schemes
    SET
      scheme_name = ?,
      short_description = ?,
      description = ?,
      benefits = ?,
      category_id = ?,
      start_date = ?,
      end_date = ?,
      applicable_scope = ?,
      applicable_state = ?,
      official_application_url = ?,
      official_source_url = ?,
      source_last_verified_at = ?,
      publication_status = ?
    WHERE scheme_id = ?
  `;
  const params = [
    schemeData.scheme_name.trim(),
    schemeData.short_description.trim(),
    schemeData.description.trim(),
    schemeData.benefits.trim(),
    schemeData.category_id,
    schemeData.start_date,
    schemeData.end_date || null,
    schemeData.applicable_scope || 'National',
    schemeData.applicable_state || null,
    schemeData.official_application_url || null,
    schemeData.official_source_url || null,
    schemeData.source_last_verified_at || null,
    schemeData.publication_status || 'draft',
    schemeId,
  ];

  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result.affectedRows > 0;
  }
  const result = await query(sql, params);
  return result.affectedRows > 0;
}

/**
 * Updates only publication status ('draft', 'published', 'unpublished')
 */
export async function updatePublicationStatus(schemeId, status, connection = null) {
  const sql = `UPDATE schemes SET publication_status = ? WHERE scheme_id = ?`;
  const params = [status, schemeId];
  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result.affectedRows > 0;
  }
  const result = await query(sql, params);
  return result.affectedRows > 0;
}

/**
 * Deletes a scheme record
 */
export async function deleteScheme(schemeId, connection = null) {
  const sql = `DELETE FROM schemes WHERE scheme_id = ?`;
  if (connection) {
    const [result] = await connection.execute(sql, [schemeId]);
    return result.affectedRows > 0;
  }
  const result = await query(sql, [schemeId]);
  return result.affectedRows > 0;
}

/**
 * Aggregates statistics for admin dashboard and public home counters
 */
export async function getDashboardStats() {
  const schemeStatsSql = `
    SELECT
      COUNT(*) AS total_schemes,
      SUM(CASE WHEN publication_status = 'published' THEN 1 ELSE 0 END) AS total_published,
      SUM(CASE WHEN publication_status = 'draft' THEN 1 ELSE 0 END) AS total_drafts,
      SUM(CASE WHEN publication_status = 'unpublished' THEN 1 ELSE 0 END) AS total_unpublished,
      SUM(CASE
        WHEN publication_status = 'published' AND CURDATE() < start_date THEN 1 ELSE 0
      END) AS total_upcoming,
      SUM(CASE
        WHEN publication_status = 'published' AND CURDATE() >= start_date AND (end_date IS NULL OR CURDATE() <= end_date) THEN 1 ELSE 0
      END) AS total_open,
      SUM(CASE
        WHEN publication_status = 'published' AND end_date IS NOT NULL AND CURDATE() > end_date THEN 1 ELSE 0
      END) AS total_closed
    FROM schemes
  `;
  const [stats] = await query(schemeStatsSql);

  const userStatsSql = `SELECT COUNT(*) AS total_users FROM users WHERE is_active = 1`;
  const [users] = await query(userStatsSql);

  const catStatsSql = `
    SELECT
      c.category_id,
      c.category_name,
      COUNT(s.scheme_id) AS total_schemes,
      SUM(CASE WHEN s.publication_status = 'published' THEN 1 ELSE 0 END) AS published_schemes
    FROM categories c
    LEFT JOIN schemes s ON c.category_id = s.category_id
    GROUP BY c.category_id, c.category_name
    ORDER BY total_schemes DESC
  `;
  const categoryBreakdown = await query(catStatsSql);

  return {
    totalSchemes: stats.total_schemes || 0,
    publishedSchemes: stats.total_published || 0,
    draftSchemes: stats.total_drafts || 0,
    unpublishedSchemes: stats.total_unpublished || 0,
    upcomingSchemes: stats.total_upcoming || 0,
    openSchemes: stats.total_open || 0,
    closedSchemes: stats.total_closed || 0,
    totalUsers: users.total_users || 0,
    categoryBreakdown,
  };
}
