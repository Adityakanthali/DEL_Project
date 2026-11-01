/**
 * Required Documents Model
 * Handles required supporting documentation for schemes.
 */

import { query } from '../config/db.js';

export async function getDocumentsBySchemeId(schemeId) {
  const sql = `
    SELECT
      document_id, scheme_id, document_name,
      description, is_mandatory, created_at
    FROM required_documents
    WHERE scheme_id = ?
    ORDER BY is_mandatory DESC, document_name ASC
  `;
  return await query(sql, [schemeId]);
}

export async function getDocumentById(documentId) {
  const sql = `
    SELECT * FROM required_documents
    WHERE document_id = ?
    LIMIT 1
  `;
  const rows = await query(sql, [documentId]);
  return rows[0] || null;
}

export async function createDocument({
  scheme_id,
  document_name,
  description,
  is_mandatory = 1,
}, connection = null) {
  const sql = `
    INSERT INTO required_documents (scheme_id, document_name, description, is_mandatory)
    VALUES (?, ?, ?, ?)
  `;
  const params = [
    scheme_id,
    document_name.trim(),
    description ? description.trim() : null,
    is_mandatory ? 1 : 0,
  ];

  if (connection) {
    const [result] = await connection.execute(sql, params);
    return result.insertId;
  }
  const result = await query(sql, params);
  return result.insertId;
}

export async function updateDocument(documentId, {
  document_name,
  description,
  is_mandatory,
}) {
  const sql = `
    UPDATE required_documents
    SET
      document_name = ?,
      description = ?,
      is_mandatory = ?
    WHERE document_id = ?
  `;
  await query(sql, [
    document_name.trim(),
    description ? description.trim() : null,
    is_mandatory ? 1 : 0,
    documentId,
  ]);
  return getDocumentById(documentId);
}

export async function deleteDocument(documentId) {
  const sql = `DELETE FROM required_documents WHERE document_id = ?`;
  const result = await query(sql, [documentId]);
  return result.affectedRows > 0;
}

export async function deleteDocumentsBySchemeId(schemeId, connection = null) {
  const sql = `DELETE FROM required_documents WHERE scheme_id = ?`;
  if (connection) {
    const [result] = await connection.execute(sql, [schemeId]);
    return result.affectedRows;
  }
  const result = await query(sql, [schemeId]);
  return result.affectedRows;
}
