/**
 * Category Controller
 * Provides category listings for filters and navigation.
 */

import * as categoryService from '../services/categoryService.js';

export async function getCategories(req, res, next) {
  try {
    const categories = await categoryService.listCategories();
    res.json({
      success: true,
      categories,
    });
  } catch (err) {
    next(err);
  }
}

export async function getCategoryById(req, res, next) {
  try {
    const categoryId = parseInt(req.params.id, 10);
    if (isNaN(categoryId)) {
      return res.status(400).json({ success: false, message: 'Invalid category ID.' });
    }
    const category = await categoryService.getCategory(categoryId);
    res.json({
      success: true,
      category,
    });
  } catch (err) {
    next(err);
  }
}
