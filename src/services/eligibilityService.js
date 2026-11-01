/**
 * Eligibility Service
 * Evaluates citizen eligibility against schemes stored in MySQL database.
 */

import * as schemeModel from '../models/schemeModel.js';
import * as eligibilityModel from '../models/eligibilityModel.js';
import { evaluateSchemeEligibility } from '../utils/eligibilityEngine.js';

/**
 * Checks preliminary eligibility for a single scheme given a user profile.
 *
 * @param {number} schemeId
 * @param {object} userProfile
 * @returns {Promise<object>} Evaluation result
 */
export async function checkEligibilityForScheme(schemeId, userProfile = {}) {
  const scheme = await schemeModel.getPublishedSchemeById(schemeId);
  if (!scheme) {
    throw new Error('Scheme not found or is currently not publicly available.');
  }

  const criteria = await eligibilityModel.getCriteriaBySchemeId(schemeId);

  const evaluation = evaluateSchemeEligibility(criteria, userProfile);

  return {
    scheme: {
      scheme_id: scheme.scheme_id,
      scheme_name: scheme.scheme_name,
      category_name: scheme.category_name,
      application_status: scheme.application_status,
      official_application_url: scheme.official_application_url,
    },
    ...evaluation,
  };
}

/**
 * Evaluates a user profile against all currently open schemes to provide
 * personalized scheme recommendations.
 *
 * @param {object} userProfile
 * @returns {Promise<Array<object>>} Ranked recommendations
 */
export async function getRecommendedSchemes(userProfile = {}) {
  // Fetch currently open schemes
  const { schemes } = await schemeModel.getPublishedSchemes({
    status: 'open',
    limit: 50,
  });

  const evaluations = [];

  for (const s of schemes) {
    const criteria = await eligibilityModel.getCriteriaBySchemeId(s.scheme_id);
    const result = evaluateSchemeEligibility(criteria, userProfile);

    evaluations.push({
      scheme_id: s.scheme_id,
      scheme_name: s.scheme_name,
      short_description: s.short_description,
      category_name: s.category_name,
      applicable_scope: s.applicable_scope,
      applicable_state: s.applicable_state,
      official_application_url: s.official_application_url,
      days_remaining: s.days_remaining,
      eligibilityStatus: result.status,
      eligibilityMessage: result.message,
      passedCount: result.summary.passedCount,
      totalCriteria: result.summary.totalCriteria,
      criteriaResults: result.criteriaResults,
      disclaimer: result.disclaimer,
    });
  }

  // Sort: Likely Eligible first, then More Info, then Not Eligible
  const priority = {
    'Likely Eligible': 1,
    'More Information Required': 2,
    'Not Eligible': 3,
  };

  evaluations.sort((a, b) => {
    const pA = priority[a.eligibilityStatus] || 99;
    const pB = priority[b.eligibilityStatus] || 99;
    if (pA !== pB) return pA - pB;
    return b.passedCount - a.passedCount;
  });

  return evaluations;
}
