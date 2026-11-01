/**
 * Citizen User Profile and Saved Schemes Routes
 */

import { Router } from 'express';
import * as userController from '../controllers/userController.js';
import { requireUserAuth } from '../middleware/authMiddleware.js';

const router = Router();

// All user routes require authenticated citizen session
router.use(requireUserAuth);

router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

router.get('/saved-schemes', userController.getSavedSchemes);
router.post('/saved-schemes/:schemeId', userController.saveScheme);
router.delete('/saved-schemes/:schemeId', userController.removeSavedScheme);

export default router;
