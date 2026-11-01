/**
 * Administrator Protected Routes
 */

import { Router } from 'express';
import * as adminController from '../controllers/adminController.js';
import { requireAdminAuth } from '../middleware/adminMiddleware.js';
import { validateSchemeInput } from '../middleware/validateMiddleware.js';

const router = Router();

// Strictly guard all admin endpoints
router.use(requireAdminAuth);

// Dashboard Metrics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Scheme Management
router.get('/schemes', adminController.getSchemes);
router.get('/schemes/:id', adminController.getSchemeById);
router.post('/schemes', validateSchemeInput, adminController.createScheme);
router.put('/schemes/:id', validateSchemeInput, adminController.updateScheme);
router.patch('/schemes/:id/publication', adminController.updatePublication);
router.delete('/schemes/:id', adminController.deleteScheme);

// Category Management
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Criteria Management
router.post('/criteria', adminController.createCriterion);
router.put('/criteria/:id', adminController.updateCriterion);
router.delete('/criteria/:id', adminController.deleteCriterion);

// Document Management
router.post('/documents', adminController.createDocument);
router.put('/documents/:id', adminController.updateDocument);
router.delete('/documents/:id', adminController.deleteDocument);

// Audit Logs
router.get('/audit-logs', adminController.getAuditLogs);

export default router;
