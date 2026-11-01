/**
 * Category Public Routes
 */

import { Router } from 'express';
import * as categoryController from '../controllers/categoryController.js';

const router = Router();

router.get('/', categoryController.getCategories);
router.get('/:id', categoryController.getCategoryById);

export default router;
