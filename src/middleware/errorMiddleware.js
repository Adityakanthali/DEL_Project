/**
 * Centralized Error Handling Middleware
 * Prevents credential or stack trace exposure while providing clear responses.
 */

import { ENV } from '../config/env.js';

export function notFoundHandler(req, res, next) {
  // If API route
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      success: false,
      message: `API endpoint ${req.method} ${req.path} not found.`,
    });
  }
  // If static page
  return res.status(404).sendFile('index.html', { root: './public' });
}

export function globalErrorHandler(err, req, res, next) {
  console.error('[SERVER ERROR]:', err);

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error. Please try again later.';

  const response = {
    success: false,
    message,
  };

  // Only include debug stack trace in non-production environments
  if (!ENV.IS_PROD) {
    response.stack = err.stack;
  }

  res.status(statusCode).json(response);
}
