/**
 * Audit Log Model
 * Tracks all administrative scheme modifications, additions, and deletions.
 */

import { query } from '../config/db.js';

export async function logAction({
  adminId = null,
  schemeId = null,
  actionType,
  description,
}, connection = null) {
  const sql = `
    INSERT INTO scheme_audit_log (admin_id, scheme_id, action_type, description)
    VALUES (?, ?, ?, ?)
  `;
  const params = [adminId, schemeId, actionType, description];

  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result.insertId;
  }
  const result = await query(sql, params);
  return result.insertId;
}

export async function getAuditLogs({ limit = 50, offset = 0, actionType = null }) {
  let sql = `
    SELECT
      a.audit_id,
      a.admin_id,
      adm.full_name AS admin_name,
      adm.email AS admin_email,
      a.scheme_id,
      s.scheme_name,
      a.action_type,
      a.description,
      a.changed_at
    FROM scheme_audit_log a
    LEFT JOIN admins adm ON a.admin_id = adm.admin_id
    LEFT JOIN schemes s ON a.scheme_id = s.scheme_id
  `;
  const params = [];

  if (actionType) {
    sql += ` WHERE a.action_type = ?`;
    params.push(actionType);
  }

  sql += ` ORDER BY a.changed_at DESC LIMIT ? OFFSET ?`;
  params.push(Number(limit), Number(offset));

  return await query(sql, params);
}

export async function countAuditLogs(actionType = null) {
  let sql = `SELECT COUNT(*) AS total FROM scheme_audit_log`;
  const params = [];
  if (actionType) {
    sql += ` WHERE action_type = ?`;
    params.push(actionType);
  }
  const rows = await query(sql, params);
  return rows[0].total || 0;
}
