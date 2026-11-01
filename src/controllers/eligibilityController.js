/**
 * Eligibility Controller
 * Evaluates citizen eligibility against scheme rules and provides recommendations.
 */

import * as eligibilityService from '../services/eligibilityService.js';
import * as userModel from '../models/userModel.js';

export async function checkEligibility(req, res, next) {
  try {
    const { schemeId, profile } = req.body;

    if (!schemeId || isNaN(parseInt(schemeId, 10))) {
      return res.status(400).json({
        success: false,
        message: 'A valid schemeId is required.',
      });
    }

    // Determine profile data: either provided in body or fetched from logged in user
    let userProfile = profile || {};

    if (req.session && req.session.user) {
      const loggedUser = await userModel.findById(req.session.user.user_id);
      if (loggedUser) {
        // Merge: body inputs take precedence over stored profile for interactive "what-if" testing
        userProfile = {
          date_of_birth: loggedUser.date_of_birth,
          state: loggedUser.state,
          district: loggedUser.district,
          occupation: loggedUser.occupation,
          annual_income: loggedUser.annual_income,
          education_level: loggedUser.education_level,
          beneficiary_group: loggedUser.beneficiary_group,
          ...userProfile,
        };
      }
    }

    const evaluation = await eligibilityService.checkEligibilityForScheme(
      parseInt(schemeId, 10),
      userProfile
    );

    res.json({
      success: true,
      ...evaluation,
    });
  } catch (err) {
    next(err);
  }
}

export async function getRecommendations(req, res, next) {
  try {
    let userProfile = req.body.profile || {};

    if (req.session && req.session.user) {
      const loggedUser = await userModel.findById(req.session.user.user_id);
      if (loggedUser) {
        userProfile = {
          date_of_birth: loggedUser.date_of_birth,
          state: loggedUser.state,
          occupation: loggedUser.occupation,
          annual_income: loggedUser.annual_income,
          education_level: loggedUser.education_level,
          beneficiary_group: loggedUser.beneficiary_group,
          ...userProfile,
        };
      }
    }

    const recommendations = await eligibilityService.getRecommendedSchemes(userProfile);

    res.json({
      success: true,
      totalEvaluated: recommendations.length,
      recommendations,
    });
  } catch (err) {
    next(err);
  }
}
