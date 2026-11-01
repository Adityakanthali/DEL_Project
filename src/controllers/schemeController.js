/**
 * Public Scheme Controller
 * Citizen-facing endpoints for searching, filtering, and viewing published schemes.
 */

import * as schemeModel from '../models/schemeModel.js';
import * as schemeService from '../services/schemeService.js';
import * as savedSchemeModel from '../models/savedSchemeModel.js';

export async function getSchemes(req, res, next) {
  try {
    const {
      search,
      categoryId,
      state,
      occupation,
      status,
      minAge,
      maxIncome,
      sortBy,
      order,
      page,
      limit,
    } = req.query;

    const result = await schemeModel.getPublishedSchemes({
      search,
      categoryId,
      state,
      occupation,
      status,
      minAge,
      maxIncome,
      sortBy,
      order,
      page,
      limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function getSchemeById(req, res, next) {
  try {
    const schemeId = parseInt(req.params.id, 10);
    if (isNaN(schemeId)) {
      return res.status(400).json({ success: false, message: 'Invalid Scheme ID.' });
    }

    const scheme = await schemeService.getPublicSchemeFullDetails(schemeId);
    if (!scheme) {
      return res.status(404).json({
        success: false,
        message: 'Scheme not found or is currently not available to the public.',
      });
    }

    // Check if authenticated user has bookmarked this scheme
    let isSaved = false;
    if (req.session && req.session.user) {
      isSaved = await savedSchemeModel.isSchemeSavedByUser(req.session.user.user_id, schemeId);
    }

    res.json({
      success: true,
      scheme: {
        ...scheme,
        isSaved,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getFeatured(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '4', 10);
    const schemes = await schemeModel.getFeaturedSchemes(limit);
    res.json({
      success: true,
      schemes,
    });
  } catch (err) {
    next(err);
  }
}

export async function getClosingSoon(req, res, next) {
  try {
    const limit = parseInt(req.query.limit || '4', 10);
    const schemes = await schemeModel.getClosingSoonSchemes(limit);
    res.json({
      success: true,
      schemes,
    });
  } catch (err) {
    next(err);
  }
}
