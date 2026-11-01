/**
 * Administrator Authorization Middleware
 * Strictly guards admin endpoints against unauthorized access or privilege escalation.
 */

export function requireAdminAuth(req, res, next) {
  if (req.session && req.session.admin && req.session.admin.admin_id) {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Access forbidden. Administrative privileges required.',
  });
}
