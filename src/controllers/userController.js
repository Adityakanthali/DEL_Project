/**
 * User Controller
 * Manages citizen user profile, demographic attributes, and bookmarked schemes.
 */

import * as userModel from '../models/userModel.js';
import * as savedSchemeModel from '../models/savedSchemeModel.js';
import * as schemeModel from '../models/schemeModel.js';
import { calculateAge } from '../utils/dateUtils.js';

export async function getProfile(req, res, next) {
  try {
    const userId = req.session.user.user_id;
    const user = await userModel.findById(userId);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User profile not found.' });
    }

    const age = calculateAge(user.date_of_birth);

    res.json({
      success: true,
      profile: {
        ...user,
        age,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const userId = req.session.user.user_id;
    const {
      full_name,
      date_of_birth,
      state,
      district,
      occupation,
      annual_income,
      education_level,
      beneficiary_group,
    } = req.body;

    const updatedUser = await userModel.updateProfile(userId, {
      full_name,
      date_of_birth,
      state,
      district,
      occupation,
      annual_income,
      education_level,
      beneficiary_group,
    });

    // Update name in session if changed
    if (full_name) {
      req.session.user.full_name = full_name;
    }

    const age = calculateAge(updatedUser.date_of_birth);

    res.json({
      success: true,
      message: 'Profile updated successfully!',
      profile: {
        ...updatedUser,
        age,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSavedSchemes(req, res, next) {
  try {
    const userId = req.session.user.user_id;
    const saved = await savedSchemeModel.getUserSavedSchemes(userId);
    res.json({
      success: true,
      total: saved.length,
      savedSchemes: saved,
    });
  } catch (err) {
    next(err);
  }
}

export async function saveScheme(req, res, next) {
  try {
    const userId = req.session.user.user_id;
    const schemeId = parseInt(req.params.schemeId, 10);

    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    // Verify scheme exists and is published
    const scheme = await schemeModel.getPublishedSchemeById(schemeId);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found or is currently unpublished.',
      });
    }

    await savedSchemeModel.saveScheme(userId, schemeId);

    res.json({
      success: true,
      message: 'Scheme saved to your bookmarks!',
    });
  } catch (err) {
    next(err);
  }
}

export async function removeSavedScheme(req, res, next) {
  try {
    const userId = req.session.user.user_id;
    const schemeId = parseInt(req.params.schemeId, 10);

    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    await savedSchemeModel.removeSavedScheme(userId, schemeId);

    res.json({
      success: true,
      message: 'Scheme removed from your saved list.',
    });
  } catch (err) {
    next(err);
  }
}
