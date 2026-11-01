/**
 * Eligibility Evaluation Engine
 * Pure business logic for evaluating user profile attributes against
 * scheme eligibility rules with allowlisted types and comparison operators.
 */

import { calculateAge } from './dateUtils.js';

// Safe allowlists to prevent injection or unexpected evaluations
export const ALLOWED_OPERATORS = new Set(['>', '>=', '<', '<=', '=']);

export const ALLOWED_CRITERION_TYPES = new Set([
  'min_age',
  'max_age',
  'min_income',
  'max_income',
  'occupation',
  'state',
  'education_level',
  'beneficiary_group',
]);

/**
 * Normalizes categorical string for comparison (case-insensitive, trimmed).
 * @param {string|any} val
 * @returns {string}
 */
export function normalizeCategorical(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim().toLowerCase();
}

/**
 * Maps incoming criterion type aliases to standard internal keys.
 * @param {string} type
 * @returns {string}
 */
export function normalizeCriterionType(type) {
  const t = String(type || '').trim().toLowerCase();
  switch (t) {
    case 'minimum age':
    case 'min_age':
      return 'min_age';
    case 'maximum age':
    case 'max_age':
      return 'max_age';
    case 'minimum income':
    case 'min_income':
      return 'min_income';
    case 'maximum income':
    case 'max_income':
      return 'max_income';
    case 'occupation':
      return 'occupation';
    case 'state':
      return 'state';
    case 'education level':
    case 'education_level':
      return 'education_level';
    case 'beneficiary group':
    case 'beneficiary_group':
      return 'beneficiary_group';
    default:
      return t;
  }
}

/**
 * Extracts relevant profile value for a given criterion type.
 * @param {object} profile
 * @param {string} criterionType
 * @returns {any}
 */
export function getProfileValueForCriterion(profile = {}, criterionType) {
  switch (criterionType) {
    case 'min_age':
    case 'max_age':
      if (profile.age !== undefined && profile.age !== null && profile.age !== '') {
        return Number(profile.age);
      }
      if (profile.date_of_birth) {
        return calculateAge(profile.date_of_birth);
      }
      return null;

    case 'min_income':
    case 'max_income':
      if (profile.annual_income !== undefined && profile.annual_income !== null && profile.annual_income !== '') {
        return Number(profile.annual_income);
      }
      return null;

    case 'occupation':
      return profile.occupation || null;

    case 'state':
      return profile.state || null;

    case 'education_level':
      return profile.education_level || null;

    case 'beneficiary_group':
      return profile.beneficiary_group || null;

    default:
      return null;
  }
}

/**
 * Evaluates a single criterion against a user profile value.
 * @param {object} criterion
 * @param {object} profile
 * @returns {object} { status: 'passed'|'failed'|'missing_info', explanation: string }
 */
export function evaluateSingleCriterion(criterion, profile) {
  const normType = normalizeCriterionType(criterion.criterion_type);
  const operator = criterion.operator;
  const targetVal = criterion.criterion_value;
  const isMandatory = Boolean(criterion.is_mandatory);
  const description = criterion.description || `${criterion.criterion_type} ${operator} ${targetVal}`;

  // Check allowlist
  if (!ALLOWED_CRITERION_TYPES.has(normType)) {
    return {
      criterion_id: criterion.criterion_id,
      criterion_type: normType,
      operator,
      target_value: targetVal,
      is_mandatory: isMandatory,
      description,
      status: 'missing_info',
      explanation: `Criterion type "${criterion.criterion_type}" is not recognized by the evaluation engine.`,
    };
  }

  if (!ALLOWED_OPERATORS.has(operator)) {
    return {
      criterion_id: criterion.criterion_id,
      criterion_type: normType,
      operator,
      target_value: targetVal,
      is_mandatory: isMandatory,
      description,
      status: 'missing_info',
      explanation: `Comparison operator "${operator}" is not supported.`,
    };
  }

  const userVal = getProfileValueForCriterion(profile, normType);

  // Missing profile information check
  if (userVal === null || userVal === undefined || userVal === '') {
    return {
      criterion_id: criterion.criterion_id,
      criterion_type: normType,
      operator,
      target_value: targetVal,
      is_mandatory: isMandatory,
      description,
      status: 'missing_info',
      explanation: `Your profile is missing "${normType}". Please provide this value to verify eligibility.`,
    };
  }

  // Numeric comparisons: min_age, max_age, min_income, max_income
  if (['min_age', 'max_age', 'min_income', 'max_income'].includes(normType)) {
    const numUser = Number(userVal);
    const numTarget = Number(targetVal);

    if (isNaN(numUser) || isNaN(numTarget)) {
      return {
        criterion_id: criterion.criterion_id,
        criterion_type: normType,
        operator,
        target_value: targetVal,
        is_mandatory: isMandatory,
        description,
        status: 'missing_info',
        explanation: `Unable to compare numeric values for "${normType}".`,
      };
    }

    let passed = false;
    switch (operator) {
      case '>':
        passed = numUser > numTarget;
        break;
      case '>=':
        passed = numUser >= numTarget;
        break;
      case '<':
        passed = numUser < numTarget;
        break;
      case '<=':
        passed = numUser <= numTarget;
        break;
      case '=':
        passed = numUser === numTarget;
        break;
      default:
        passed = false;
    }

    if (passed) {
      return {
        criterion_id: criterion.criterion_id,
        criterion_type: normType,
        operator,
        target_value: targetVal,
        user_value: numUser,
        is_mandatory: isMandatory,
        description,
        status: 'passed',
        explanation: `Satisfied: Your value (${numUser}) meets the requirement (${operator} ${numTarget}).`,
      };
    } else {
      return {
        criterion_id: criterion.criterion_id,
        criterion_type: normType,
        operator,
        target_value: targetVal,
        user_value: numUser,
        is_mandatory: isMandatory,
        description,
        status: 'failed',
        explanation: `Not satisfied: Your value (${numUser}) does not meet the requirement (${operator} ${numTarget}).`,
      };
    }
  }

  // Categorical string comparisons: occupation, state, education_level, beneficiary_group
  const strUser = normalizeCategorical(userVal);
  const strTarget = normalizeCategorical(targetVal);

  let passed = false;
  if (operator === '=') {
    // Exact or inclusive token match
    passed = strUser === strTarget || strUser.includes(strTarget) || strTarget.includes(strUser);
  } else {
    // Non-equality operators are unsupported for string categories
    return {
      criterion_id: criterion.criterion_id,
      criterion_type: normType,
      operator,
      target_value: targetVal,
      is_mandatory: isMandatory,
      description,
      status: 'missing_info',
      explanation: `Operator "${operator}" cannot be applied to categorical text.`,
    };
  }

  if (passed) {
    return {
      criterion_id: criterion.criterion_id,
      criterion_type: normType,
      operator,
      target_value: targetVal,
      user_value: userVal,
      is_mandatory: isMandatory,
      description,
      status: 'passed',
      explanation: `Satisfied: Your ${normType} ("${userVal}") matches required "${targetVal}".`,
    };
  } else {
    return {
      criterion_id: criterion.criterion_id,
      criterion_type: normType,
      operator,
      target_value: targetVal,
      user_value: userVal,
      is_mandatory: isMandatory,
      description,
      status: 'failed',
      explanation: `Not satisfied: Your ${normType} ("${userVal}") does not match "${targetVal}".`,
    };
  }
}

/**
 * Main evaluation orchestrator: Evaluates all scheme criteria against a user profile.
 *
 * Decision Table:
 * - No criteria configured -> 'More Information Required'
 * - Any mandatory criterion fails -> 'Not Eligible'
 * - Any mandatory criterion missing info -> 'More Information Required'
 * - All mandatory passed, some optional failed -> 'Likely Eligible' (with warning notes)
 * - All passed -> 'Likely Eligible'
 *
 * @param {Array<object>} criteriaList
 * @param {object} userProfile
 * @returns {object} Result with status, message, criteriaResults, and disclaimer
 */
export function evaluateSchemeEligibility(criteriaList = [], userProfile = {}) {
  const disclaimer =
    'DISCLAIMER: This eligibility assessment is preliminary, automated guidance based on college project criteria. Official approval is subject to document verification and terms set by the responsible government department.';

  if (!criteriaList || criteriaList.length === 0) {
    return {
      status: 'More Information Required',
      message: 'No specific eligibility criteria have been configured for this scheme yet. Please refer to the official notification.',
      criteriaResults: [],
      summary: {
        totalCriteria: 0,
        passedCount: 0,
        failedCount: 0,
        missingCount: 0,
      },
      disclaimer,
    };
  }

  const results = criteriaList.map((crit) => evaluateSingleCriterion(crit, userProfile));

  let mandatoryFailed = false;
  let mandatoryMissing = false;
  let passedCount = 0;
  let failedCount = 0;
  let missingCount = 0;

  for (const r of results) {
    if (r.status === 'passed') {
      passedCount++;
    } else if (r.status === 'failed') {
      failedCount++;
      if (r.is_mandatory) {
        mandatoryFailed = true;
      }
    } else if (r.status === 'missing_info') {
      missingCount++;
      if (r.is_mandatory) {
        mandatoryMissing = true;
      }
    }
  }

  let overallStatus = 'Likely Eligible';
  let message = 'All mandatory criteria were satisfied. You are likely eligible to apply.';

  if (mandatoryFailed) {
    overallStatus = 'Not Eligible';
    message = 'You do not meet one or more mandatory criteria for this scheme.';
  } else if (mandatoryMissing) {
    overallStatus = 'More Information Required';
    message = 'Your profile is missing information needed to evaluate one or more mandatory requirements.';
  } else if (failedCount > 0) {
    // Mandatory passed, but optional failed
    overallStatus = 'Likely Eligible';
    message = 'You satisfy all mandatory requirements. Note that some optional preferences were not met.';
  }

  return {
    status: overallStatus,
    message,
    criteriaResults: results,
    summary: {
      totalCriteria: criteriaList.length,
      passedCount,
      failedCount,
      missingCount,
    },
    disclaimer,
  };
}
