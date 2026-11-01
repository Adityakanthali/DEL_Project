/**
 * Authentication Controller
 * Handles citizen registration, login, admin authentication, session regeneration, and logout.
 */

import bcrypt from 'bcryptjs';
import * as userModel from '../models/userModel.js';
import * as adminModel from '../models/adminModel.js';
import { ENV } from '../config/env.js';

/**
 * Register a new citizen account
 */
export async function register(req, res, next) {
  try {
    const { full_name, email, password } = req.body;

    // Check if email already registered
    const existing = await userModel.findByEmail(email);
    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email address is already registered.',
      });
    }

    // Hash password with bcrypt
    const passwordHash = await bcrypt.hash(password, ENV.BCRYPT_SALT_ROUNDS);

    const userId = await userModel.createUser({
      fullName: full_name,
      email,
      passwordHash,
    });

    const newUser = await userModel.findById(userId);

    // Regenerate session to prevent session fixation attacks
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        user_id: newUser.user_id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: 'citizen',
      };

      res.status(201).json({
        success: true,
        message: 'Account registered successfully!',
        user: req.session.user,
      });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Citizen Login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your account has been deactivated. Please contact support.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
    }

    // Regenerate session ID upon successful login
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.user = {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: 'citizen',
      };

      res.json({
        success: true,
        message: 'Logged in successfully!',
        user: req.session.user,
      });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Dedicated Admin Login (Only verified admins allowed)
 */
export async function adminLogin(req, res, next) {
  try {
    const { email, password } = req.body;

    const admin = await adminModel.findByEmail(email);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    if (!admin.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Administrator account is deactivated.',
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid administrator credentials.',
      });
    }

    // Regenerate session ID for admin
    req.session.regenerate((err) => {
      if (err) return next(err);

      req.session.admin = {
        admin_id: admin.admin_id,
        full_name: admin.full_name,
        email: admin.email,
        role: admin.role,
      };

      res.json({
        success: true,
        message: 'Administrator authenticated successfully!',
        admin: req.session.admin,
      });
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Logout (Invalidates session and clears cookie)
 */
export async function logout(req, res, next) {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('connect.sid');
    res.json({
      success: true,
      message: 'Logged out successfully.',
    });
  });
}

/**
 * Get current session state and CSRF token
 */
export async function getMe(req, res) {
  res.json({
    success: true,
    user: req.session ? req.session.user || null : null,
    admin: req.session ? req.session.admin || null : null,
    csrfToken: req.session ? req.session.csrfToken || null : null,
  });
}

/**
 * Expose CSRF token explicitly for frontend forms
 */
export async function getCsrfToken(req, res) {
  res.json({
    csrfToken: req.session ? req.session.csrfToken : null,
  });
}
