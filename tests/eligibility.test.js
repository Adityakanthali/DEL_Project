/**
 * Eligibility Engine Unit Tests
 * Verifies core eligibility business logic, operator evaluation, allowlisting,
 * and edge conditions without requiring an active database connection.
 */

import {
  evaluateSingleCriterion,
  evaluateSchemeEligibility,
  ALLOWED_OPERATORS,
  ALLOWED_CRITERION_TYPES,
} from '../src/utils/eligibilityEngine.js';

export function runEligibilityTests() {
  console.log('\n--- Running Eligibility Engine Unit Tests ---');
  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // Test 1: Minimum age check (Satisfied)
  {
    const crit = { criterion_type: 'min_age', operator: '>=', criterion_value: '18', is_mandatory: 1 };
    const res = evaluateSingleCriterion(crit, { age: 24 });
    assert(res.status === 'passed', 'Applicant with age 24 passes min_age >= 18');
  }

  // Test 2: Minimum age check (Failed)
  {
    const crit = { criterion_type: 'min_age', operator: '>=', criterion_value: '18', is_mandatory: 1 };
    const res = evaluateSingleCriterion(crit, { age: 16 });
    assert(res.status === 'failed', 'Applicant with age 16 fails min_age >= 18');
  }

  // Test 3: Maximum income check (Satisfied)
  {
    const crit = { criterion_type: 'max_income', operator: '<=', criterion_value: '250000', is_mandatory: 1 };
    const res = evaluateSingleCriterion(crit, { annual_income: 180000 });
    assert(res.status === 'passed', 'Income 180,000 passes max_income <= 250,000');
  }

  // Test 4: Maximum income check (Failed)
  {
    const crit = { criterion_type: 'max_income', operator: '<=', criterion_value: '250000', is_mandatory: 1 };
    const res = evaluateSingleCriterion(crit, { annual_income: 300000 });
    assert(res.status === 'failed', 'Income 300,000 fails max_income <= 250,000');
  }

  // Test 5: Missing profile data returns 'missing_info'
  {
    const crit = { criterion_type: 'max_income', operator: '<=', criterion_value: '250000', is_mandatory: 1 };
    const res = evaluateSingleCriterion(crit, { age: 24 }); // no annual_income
    assert(res.status === 'missing_info', 'Missing annual_income yields status "missing_info"');
  }

  // Test 6: Categorical text matching (Case-insensitive)
  {
    const crit = { criterion_type: 'occupation', operator: '=', criterion_value: 'Farmer', is_mandatory: 1 };
    const res = evaluateSingleCriterion(crit, { occupation: 'farmer' });
    assert(res.status === 'passed', 'Case-insensitive occupation match for "farmer" vs "Farmer"');
  }

  // Test 7: Scheme with no criteria configured
  {
    const res = evaluateSchemeEligibility([], { age: 24 });
    assert(res.status === 'More Information Required', 'Scheme with empty criteria yields "More Information Required"');
  }

  // Test 8: Multi-criteria scheme: All mandatory pass
  {
    const criteria = [
      { criterion_type: 'occupation', operator: '=', criterion_value: 'Farmer', is_mandatory: 1 },
      { criterion_type: 'min_age', operator: '>=', criterion_value: '18', is_mandatory: 1 },
      { criterion_type: 'max_income', operator: '<=', criterion_value: '300000', is_mandatory: 0 },
    ];
    const profile = { occupation: 'Farmer', age: 30, annual_income: 200000 };
    const res = evaluateSchemeEligibility(criteria, profile);
    assert(res.status === 'Likely Eligible', 'All mandatory pass -> "Likely Eligible"');
  }

  // Test 9: Multi-criteria scheme: One mandatory fails
  {
    const criteria = [
      { criterion_type: 'occupation', operator: '=', criterion_value: 'Farmer', is_mandatory: 1 },
      { criterion_type: 'min_age', operator: '>=', criterion_value: '18', is_mandatory: 1 },
    ];
    const profile = { occupation: 'Student', age: 22 };
    const res = evaluateSchemeEligibility(criteria, profile);
    assert(res.status === 'Not Eligible', 'One mandatory fail -> "Not Eligible"');
  }

  // Test 10: Mandatory passed, but optional failed -> Still 'Likely Eligible'
  {
    const criteria = [
      { criterion_type: 'min_age', operator: '>=', criterion_value: '18', is_mandatory: 1 },
      { criterion_type: 'max_income', operator: '<=', criterion_value: '150000', is_mandatory: 0 },
    ];
    const profile = { age: 25, annual_income: 200000 };
    const res = evaluateSchemeEligibility(criteria, profile);
    assert(res.status === 'Likely Eligible', 'Optional failed does not disqualify -> "Likely Eligible"');
  }

  console.log(`Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}
