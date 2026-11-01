/**
 * CSRF Protection Middleware
 * Protects session-authenticated state-changing operations against CSRF.
 */

import crypto from 'crypto';

/**
 * Ensures session has an assigned CSRF token and exposes a route to retrieve it.
 */
export function initCsrf(req, res, next) {
  if (req.session && !req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(24).toString('hex');
  }
  next();
}

/**
 * Validates CSRF token on mutating HTTP requests.
 */
export function verifyCsrf(req, res, next) {
  // Safe read-only HTTP methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Bypass during automated unit testing if flagged
  if (process.env.NODE_ENV === 'test' && req.headers['x-bypass-csrf'] === 'test-suite') {
    return next();
  }

  // Exempt auth routes (login and registration do not require prior session CSRF)
  if (
    req.path === '/api/auth/login' ||
    req.path === '/api/auth/admin-login' ||
    req.path === '/api/auth/register'
  ) {
    return next();
  }

  const token =
    req.headers['x-csrf-token'] ||
    (req.body && req.body._csrf) ||
    req.query._csrf;

  if (!token || !req.session || token !== req.session.csrfToken) {
    return res.status(403).json({
      success: false,
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
    });
  }

  next();
}
