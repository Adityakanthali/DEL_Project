/**
 * Eligibility Criteria Model
 * Handles database operations for eligibility conditions.
 */

import { query } from '../config/db.js';

export async function getCriteriaBySchemeId(schemeId) {
  const sql = `
    SELECT
      criterion_id, scheme_id, criterion_type,
      operator, criterion_value, is_mandatory,
      description, created_at, updated_at
    FROM eligibility_criteria
    WHERE scheme_id = ?
    ORDER BY is_mandatory DESC, criterion_type ASC
  `;
  return await query(sql, [schemeId]);
}

export async function getCriterionById(criterionId) {
  const sql = `
    SELECT * FROM eligibility_criteria
    WHERE criterion_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [criterionId]);
  return rows[0] || null;
}

export async function createCriterion({
  scheme_id,
  criterion_type,
  operator,
  criterion_value,
  is_mandatory = 1,
  description,
}, connection = null) {
  const sql = `
    INSERT INTO eligibility_criteria (
      scheme_id, criterion_type, operator,
      criterion_value, is_mandatory, description
    ) VALUES (?, ?, ?, ?, ?, ?)
  `;
  const params = [
    scheme_id,
    criterion_type,
    operator,
    String(criterion_value).trim(),
    is_mandatory ? 1 : 0,
    description ? description.trim() : `${criterion_type} ${operator} ${criterion_value}`,
  ];

  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result.insertId;
  }
  const result = await query(sql, params);
  return result.insertId;
}

export async function updateCriterion(criterionId, {
  criterion_type,
  operator,
  criterion_value,
  is_mandatory,
  description,
}) {
  const sql = `
    UPDATE eligibility_criteria
    SET
      criterion_type = ?,
      operator = ?,
      criterion_value = ?,
      is_mandatory = ?,
      description = ?
    WHERE criterion_id = ?
  `;
  await query(sql, [
    criterion_type,
    operator,
    String(criterion_value).trim(),
    is_mandatory ? 1 : 0,
    description ? description.trim() : null,
    criterionId,
  ]);
  return getCriterionById(criterionId);
}

export async function deleteCriterion(criterionId) {
  const sql = `DELETE FROM eligibility_criteria WHERE criterion_id = ?`;
  const result = await query(sql, [criterionId]);
  return result.affectedRows > 0;
}

export async function deleteCriteriaBySchemeId(schemeId, connection = null) {
  const sql = `DELETE FROM eligibility_criteria WHERE scheme_id = ?`;
  if (connection) {
    const [result] = await connection.execute(sql, [schemeId]);
    return result.affectedRows;
  }
  const result = await query(sql, [schemeId]);
  return result.affectedRows;
}
