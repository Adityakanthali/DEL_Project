/**
 * Date and Timeline Utilities
 * Handles age calculation, date validation, and application status evaluation.
 */

/**
 * Calculates accurate age in completed years from a YYYY-MM-DD date string.
 * @param {string|Date} dob
 * @returns {number|null} Age in years
 */
export function calculateAge(dob) {
  if (!dob) return null;
  const birthDate = new Date(dob);
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age >= 0 ? age : null;
}

/**
 * Determines scheme lifecycle and application status.
 * Consistent with database function fn_calculate_scheme_status.
 * @param {string} pubStatus - 'draft', 'published', 'unpublished'
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {'Draft'|'Unpublished'|'Upcoming'|'Open'|'Closed'}
 */
export function calculateSchemeStatus(pubStatus, startDate, endDate) {
  if (pubStatus === 'draft') return 'Draft';
  if (pubStatus === 'unpublished') return 'Unpublished';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(startDate);
  start.setHours(0, 0, 0, 0);

  if (today < start) {
    return 'Upcoming';
  }

  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    if (today > end) {
      return 'Closed';
    }
  }

  return 'Open';
}

/**
 * Validates that an end date does not precede the start date.
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {boolean}
 */
export function isDateRangeValid(startDate, endDate) {
  if (!startDate) return false;
  if (!endDate) return true; // Open-ended scheme is valid
  const start = new Date(startDate);
  const end = new Date(endDate);
  return end >= start;
}

/**
 * Returns remaining days until deadline, or null if no deadline.
 * @param {string|Date} endDate
 * @returns {number|null}
 */
export function getDaysRemaining(endDate) {
  if (!endDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Formats date into readable DD-MMM-YYYY format (e.g., 25-Oct-2026).
 * @param {string|Date} dateStr
 * @returns {string}
 */
export function formatDisplayDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
