/**
 * Scheme Service
 * Coordinates multi-table transactional workflows for schemes, criteria,
 * documents, and audit logging.
 */

import { getPool } from '../config/db.js';
import * as schemeModel from '../models/schemeModel.js';
import * as eligibilityModel from '../models/eligibilityModel.js';
import * as documentModel from '../models/documentModel.js';
import * as auditModel from '../models/auditModel.js';
import { isDateRangeValid } from '../utils/dateUtils.js';

/**
 * Creates a scheme along with its eligibility criteria and required documents in a single transaction.
 */
export async function createSchemeWithRelations({
  schemeData,
  criteriaList = [],
  documentList = [],
  adminId,
}) {
  if (!isDateRangeValid(schemeData.start_date, schemeData.end_date)) {
    throw new Error('Closing date cannot precede the opening date.');
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    schemeData.created_by_admin_id = adminId;
    const newSchemeId = await schemeModel.createScheme(schemeData, connection);

    // Insert criteria if provided
    if (Array.isArray(criteriaList) && criteriaList.length > 0) {
      for (const crit of criteriaList) {
        if (crit.criterion_type && crit.operator && crit.criterion_value !== undefined) {
          await eligibilityModel.createCriterion(
            {
              scheme_id: newSchemeId,
              criterion_type: crit.criterion_type,
              operator: crit.operator,
              criterion_value: crit.criterion_value,
              is_mandatory: crit.is_mandatory !== undefined ? crit.is_mandatory : 1,
              description: crit.description || '',
            },
            connection
          );
        }
      }
    }

    // Insert documents if provided
    if (Array.isArray(documentList) && documentList.length > 0) {
      for (const doc of documentList) {
        if (doc.document_name && doc.document_name.trim() !== '') {
          await documentModel.createDocument(
            {
              scheme_id: newSchemeId,
              document_name: doc.document_name,
              description: doc.description || '',
              is_mandatory: doc.is_mandatory !== undefined ? doc.is_mandatory : 1,
            },
            connection
          );
        }
      }
    }

    // Explicit audit log entry
    await auditModel.logAction(
      {
        adminId,
        schemeId: newSchemeId,
        actionType: 'SCHEME_CREATED',
        description: `Admin created scheme "${schemeData.scheme_name}" with status "${schemeData.publication_status}".`,
      },
      connection
    );

    await connection.commit();
    return newSchemeId;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Updates a scheme and synchronizes its criteria and documents atomically.
 */
export async function updateSchemeWithRelations(schemeId, {
  schemeData,
  criteriaList,
  documentList,
  adminId,
}) {
  if (!isDateRangeValid(schemeData.start_date, schemeData.end_date)) {
    throw new Error('Closing date cannot precede the opening date.');
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await schemeModel.updateScheme(schemeId, schemeData, connection);

    // If criteriaList is supplied, replace existing
    if (Array.isArray(criteriaList)) {
      await eligibilityModel.deleteCriteriaBySchemeId(schemeId, connection);
      for (const crit of criteriaList) {
        if (crit.criterion_type && crit.operator && crit.criterion_value !== undefined) {
          await eligibilityModel.createCriterion(
            {
              scheme_id: schemeId,
              criterion_type: crit.criterion_type,
              operator: crit.operator,
              criterion_value: crit.criterion_value,
              is_mandatory: crit.is_mandatory !== undefined ? crit.is_mandatory : 1,
              description: crit.description || '',
            },
            connection
          );
        }
      }
    }

    // If documentList is supplied, replace existing
    if (Array.isArray(documentList)) {
      await documentModel.deleteDocumentsBySchemeId(schemeId, connection);
      for (const doc of documentList) {
        if (doc.document_name && doc.document_name.trim() !== '') {
          await documentModel.createDocument(
            {
              scheme_id: schemeId,
              document_name: doc.document_name,
              description: doc.description || '',
              is_mandatory: doc.is_mandatory !== undefined ? doc.is_mandatory : 1,
            },
            connection
          );
        }
      }
    }

    await auditModel.logAction(
      {
        adminId,
        schemeId,
        actionType: 'SCHEME_UPDATED',
        description: `Admin updated scheme "${schemeData.scheme_name}".`,
      },
      connection
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Toggles or updates scheme publication status with audit logging.
 */
export async function setPublicationStatus(schemeId, status, adminId) {
  const allowed = ['draft', 'published', 'unpublished'];
  if (!allowed.includes(status)) {
    throw new Error(`Invalid publication status: ${status}`);
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const scheme = await schemeModel.getSchemeByIdAdmin(schemeId);
    if (!scheme) {
      throw new Error('Scheme not found.');
    }

    await schemeModel.updatePublicationStatus(schemeId, status, connection);

    await auditModel.logAction(
      {
        adminId,
        schemeId,
        actionType: 'STATUS_CHANGED',
        description: `Admin changed status of "${scheme.scheme_name}" from "${scheme.publication_status}" to "${status}".`,
      },
      connection
    );

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Safely deletes a scheme and records the event in audit history.
 */
export async function deleteSchemeSafe(schemeId, adminId) {
  const scheme = await schemeModel.getSchemeByIdAdmin(schemeId);
  if (!scheme) {
    throw new Error('Scheme not found.');
  }

  const pool = getPool();
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    await auditModel.logAction(
      {
        adminId,
        schemeId,
        actionType: 'SCHEME_DELETED',
        description: `Admin deleted scheme "${scheme.scheme_name}" (ID ${schemeId}).`,
      },
      connection
    );

    await schemeModel.deleteScheme(schemeId, connection);

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

/**
 * Retrieves full details for public view: scheme metadata + criteria + documents.
 */
export async function getPublicSchemeFullDetails(schemeId) {
  const scheme = await schemeModel.getPublishedSchemeById(schemeId);
  if (!scheme) {
    return null;
  }

  const [criteria, documents] = await Promise.all([
    eligibilityModel.getCriteriaBySchemeId(schemeId),
    documentModel.getDocumentsBySchemeId(schemeId),
  ]);

  return {
    ...scheme,
    criteria,
    documents,
  };
}
