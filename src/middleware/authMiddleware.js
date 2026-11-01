/**
 * Citizen Authentication Middleware
 * Enforces session-based authentication for citizen endpoints.
 */

export function requireUserAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    success: false,
    message: 'Authentication required. Please log in as a citizen to access this resource.',
  });
}

export function optionalUserAuth(req, res, next) {
  // Sets req.user if session exists, continues without error if not
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}
