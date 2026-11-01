/**
 * Authentication Routes
 */

import { Router } from 'express';
import * as authController from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/validateMiddleware.js';

const router = Router();

router.post('/register', validateRegister, authController.register);
router.post('/login', validateLogin, authController.login);
router.post('/admin-login', validateLogin, authController.adminLogin);
router.post('/logout', authController.logout);
router.get('/me', authController.getMe);
router.get('/csrf-token', authController.getCsrfToken);

export default router;
