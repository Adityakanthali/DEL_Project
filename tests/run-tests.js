/**
 * Automated Test Runner
 * Executes unit test suites for eligibility engine, date math, and validation rules.
 *
 * Usage: node tests/run-tests.js
 */

import { runEligibilityTests } from './eligibility.test.js';
import { runDateAndValidationTests } from './api-tests.js';

async function main() {
  console.log('='.repeat(70));
  console.log(' GOVERNMENT SCHEME MANAGEMENT SYSTEM - AUTOMATED UNIT TEST RUNNER ');
  console.log('='.repeat(70));

  const t1 = runEligibilityTests();
  const t2 = runDateAndValidationTests();

  const totalPassed = t1.passed + t2.passed;
  const totalFailed = t1.failed + t2.failed;

  console.log('='.repeat(70));
  console.log(`TOTAL TESTS: ${totalPassed + totalFailed} | PASSED: ${totalPassed} | FAILED: ${totalFailed}`);
  console.log('='.repeat(70));

  if (totalFailed > 0) {
    process.exit(1);
  } else {
    console.log('All automated unit tests passed successfully!');
  }
}

main().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
