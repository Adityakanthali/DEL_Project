/**
 * API and Utility Unit Tests
 * Validates date calculations, timeline statuses, and request validators.
 */

import { calculateAge, calculateSchemeStatus, isDateRangeValid, getDaysRemaining } from '../src/utils/dateUtils.js';

export function runDateAndValidationTests() {
  console.log('\n--- Running Date & Timeline Logic Unit Tests ---');
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

  // Test 1: Date Range validity
  assert(isDateRangeValid('2026-01-01', '2026-12-31') === true, 'Valid date range 2026-01-01 to 2026-12-31');
  assert(isDateRangeValid('2026-12-31', '2026-01-01') === false, 'Invalid inverted date range correctly rejected');
  assert(isDateRangeValid('2026-01-01', null) === true, 'Open-ended scheme (null end_date) is valid');

  // Test 2: Scheme status evaluation
  assert(calculateSchemeStatus('draft', '2020-01-01', '2030-01-01') === 'Draft', 'Status is "Draft" when publication_status is draft');
  assert(calculateSchemeStatus('unpublished', '2020-01-01', '2030-01-01') === 'Unpublished', 'Status is "Unpublished" when publication_status is unpublished');
  assert(calculateSchemeStatus('published', '2035-01-01', '2036-01-01') === 'Upcoming', 'Status is "Upcoming" when start_date is in the future');
  assert(calculateSchemeStatus('published', '2020-01-01', '2021-01-01') === 'Closed', 'Status is "Closed" when end_date is in the past');
  assert(calculateSchemeStatus('published', '2020-01-01', '2035-01-01') === 'Open', 'Status is "Open" when current date falls between start and end date');
  assert(calculateSchemeStatus('published', '2020-01-01', null) === 'Open', 'Status is "Open" when start_date is in past and end_date is null');

  // Test 3: Age calculation
  const today = new Date();
  const birthYear = today.getFullYear() - 25;
  const dob = `${birthYear}-01-01`;
  const computedAge = calculateAge(dob);
  assert(computedAge === 25, `Age computed accurately for birth year ${birthYear} (got ${computedAge})`);
  assert(calculateAge(null) === null, 'Null DOB returns null age');

  console.log(`Summary: ${passed} passed, ${failed} failed.\n`);
  return { passed, failed };
}
