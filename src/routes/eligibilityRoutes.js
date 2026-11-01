/**
 * Eligibility Routes
 */

import { Router } from 'express';
import * as eligibilityController from '../controllers/eligibilityController.js';

const router = Router();

router.post('/check', eligibilityController.checkEligibility);
router.post('/recommendations', eligibilityController.getRecommendations);

export default router;
