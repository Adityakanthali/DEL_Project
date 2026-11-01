/**
 * Admin Controller
 * Secure administrative endpoints for managing schemes, categories, criteria, documents, and audit logs.
 */

import * as schemeModel from '../models/schemeModel.js';
import * as schemeService from '../services/schemeService.js';
import * as categoryService from '../services/categoryService.js';
import * as eligibilityModel from '../models/eligibilityModel.js';
import * as documentModel from '../models/documentModel.js';
import * as auditModel from '../models/auditModel.js';

export async function getDashboardStats(req, res, next) {
  try {
    const stats = await schemeModel.getDashboardStats();
    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSchemes(req, res, next) {
  try {
    const { search, categoryId, status, page, limit } = req.query;
    const result = await schemeModel.getAllSchemesAdmin({
      search,
      categoryId,
      status,
      page,
      limit,
    });
    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSchemeById(req, res, next) {
  try {
    const schemeId = parseInt(req.params.id, 10);
    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    const scheme = await schemeModel.getSchemeByIdAdmin(schemeId);
    if (!scheme) {
      return res.status(404).json({ success: false, message: 'Scheme not found.' });
    }

    const [criteria, documents] = await Promise.all([
      eligibilityModel.getCriteriaBySchemeId(schemeId),
      documentModel.getDocumentsBySchemeId(schemeId),
    ]);

    res.json({
      success: true,
      scheme: {
        ...scheme,
        criteria,
        documents,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function createScheme(req, res, next) {
  try {
    const adminId = req.session.admin.admin_id;
    const {
      scheme_name,
      short_description,
      description,
      benefits,
      category_id,
      start_date,
      end_date,
      applicable_scope,
      applicable_state,
      official_application_url,
      official_source_url,
      publication_status,
      criteria,
      documents,
    } = req.body;

    const newSchemeId = await schemeService.createSchemeWithRelations({
      schemeData: {
        scheme_name,
        short_description,
        description: description || short_description,
        benefits: benefits || '',
        category_id: parseInt(category_id, 10),
        start_date,
        end_date: end_date || null,
        applicable_scope: applicable_scope || 'National',
        applicable_state: applicable_state || null,
        official_application_url: official_application_url || null,
        official_source_url: official_source_url || null,
        source_last_verified_at: new Date().toISOString().split('T')[0],
        publication_status: publication_status || 'draft',
      },
      criteriaList: criteria || [],
      documentList: documents || [],
      adminId,
    });

    res.status(201).json({
      success: true,
      message: 'Scheme created successfully!',
      schemeId: newSchemeId,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateScheme(req, res, next) {
  try {
    const adminId = req.session.admin.admin_id;
    const schemeId = parseInt(req.params.id, 10);
    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    const {
      scheme_name,
      short_description,
      description,
      benefits,
      category_id,
      start_date,
      end_date,
      applicable_scope,
      applicable_state,
      official_application_url,
      official_source_url,
      publication_status,
      criteria,
      documents,
    } = req.body;

    await schemeService.updateSchemeWithRelations(schemeId, {
      schemeData: {
        scheme_name,
        short_description,
        description: description || short_description,
        benefits: benefits || '',
        category_id: parseInt(category_id, 10),
        start_date,
        end_date: end_date || null,
        applicable_scope: applicable_scope || 'National',
        applicable_state: applicable_state || null,
        official_application_url: official_application_url || null,
        official_source_url: official_source_url || null,
        source_last_verified_at: new Date().toISOString().split('T')[0],
        publication_status: publication_status || 'draft',
      },
      criteriaList: criteria,
      documentList: documents,
      adminId,
    });

    res.json({
      success: true,
      message: 'Scheme updated successfully!',
    });
  } catch (err) {
    next(err);
  }
}

export async function updatePublication(req, res, next) {
  try {
    const adminId = req.session.admin.admin_id;
    const schemeId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    await schemeService.setPublicationStatus(schemeId, status, adminId);

    res.json({
      success: true,
      message: `Scheme status changed to ${status}.`,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteScheme(req, res, next) {
  try {
    const adminId = req.session.admin.admin_id;
    const schemeId = parseInt(req.params.id, 10);

    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    await schemeService.deleteSchemeSafe(schemeId, adminId);

    res.json({
      success: true,
      message: 'Scheme deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// Categories Management
export async function createCategory(req, res, next) {
  try {
    const { category_name, description } = req.body;
    const catId = await categoryService.createCategory({ category_name, description });
    res.status(201).json({
      success: true,
      message: 'Category created successfully!',
      categoryId: catId,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    const { category_name, description } = req.body;
    const updated = await categoryService.updateCategory(categoryId, { category_name, description });
    res.json({
      success: true,
      message: 'Category updated successfully!',
      category: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCategory(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    await categoryService.deleteCategory(categoryId);
    res.json({
      success: true,
      message: 'Category deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// Criteria Management
export async function createCriterion(req, res, next) {
  try {
    const id = await eligibilityModel.createCriterion(req.body);
    res.status(201).json({
      success: true,
      message: 'Criterion added successfully!',
      criterionId: id,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateCriterion(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await eligibilityModel.updateCriterion(id, req.body);
    res.json({
      success: true,
      message: 'Criterion updated successfully!',
      criterion: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteCriterion(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await eligibilityModel.deleteCriterion(id);
    res.json({
      success: true,
      message: 'Criterion deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// Documents Management
export async function createDocument(req, res, next) {
  try {
    const id = await documentModel.createDocument(req.body);
    res.status(201).json({
      success: true,
      message: 'Required document added successfully!',
      documentId: id,
    });
  } catch (err) {
    next(err);
  }
}

export async function updateDocument(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    const updated = await documentModel.updateDocument(id, req.body);
    res.json({
      success: true,
      message: 'Document requirement updated successfully!',
      document: updated,
    });
  } catch (err) {
    next(err);
  }
}

export async function deleteDocument(req, res, next) {
  try {
    const id = parseInt(req.params.id, 10);
    await documentModel.deleteDocument(id);
    res.json({
      success: true,
      message: 'Document requirement deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}

// Audit Logs
export async function getAuditLogs(req, res, next) {
  try {
    const { page = 1, limit = 50, actionType } = req.query;
    const parsedLimit = Math.max(1, parseInt(limit, 10));
    const offset = (Math.max(1, parseInt(page, 10)) - 1) * parsedLimit;

    const [logs, total] = await Promise.all([
      auditModel.getAuditLogs({ limit: parsedLimit, offset, actionType }),
      auditModel.countAuditLogs(actionType),
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit) || 1,
      logs,
    });
  } catch (err) {
    next(err);
  }
}
