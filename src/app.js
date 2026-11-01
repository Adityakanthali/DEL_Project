/**
 * Express Application Configuration
 * Layered architecture setup: middleware, security headers, sessions, static files, routes.
 */

import express from 'express';
import session from 'express-session';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';

import { ENV } from './config/env.js';
import { initCsrf, verifyCsrf } from './middleware/csrfMiddleware.js';
import { notFoundHandler, globalErrorHandler } from './middleware/errorMiddleware.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import schemeRoutes from './routes/schemeRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import eligibilityRoutes from './routes/eligibilityRoutes.js';
import userRoutes from './routes/userRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

const app = express();

// 1. Security HTTP headers via Helmet
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow CDN-based Lucide icons and Chart.js
    crossOriginEmbedderPolicy: false,
  })
);

// 2. Request body parsing
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// 3. Session management
app.use(
  session({
    name: 'gov_scheme_session',
    secret: ENV.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: ENV.COOKIE_SECURE,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  })
);

// 4. CSRF protection middleware
app.use(initCsrf);
app.use('/api', verifyCsrf);

// 5. Serve static frontend assets from public/
app.use(express.static(path.join(projectRoot, 'public')));

// 6. Mount REST API Routes
app.use('/api/auth', authRoutes);
app.use('/api/schemes', schemeRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/eligibility', eligibilityRoutes);
app.use('/api/user', userRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Government Scheme Management System',
  });
});

// 7. Error handlers
app.use(notFoundHandler);
app.use(globalErrorHandler);

export default app;
