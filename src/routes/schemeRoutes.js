/**
 * Scheme Public Routes
 */

import { Router } from 'express';
import * as schemeController from '../controllers/schemeController.js';

const router = Router();

router.get('/', schemeController.getSchemes);
router.get('/featured', schemeController.getFeatured);
router.get('/closing-soon', schemeController.getClosingSoon);
router.get('/:id', schemeController.getSchemeById);

export default router;
