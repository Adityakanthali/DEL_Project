/**
 * Category Service
 * Business logic and constraints for scheme category management.
 */

import * as categoryModel from '../models/categoryModel.js';

export async function listCategories() {
  return await categoryModel.getAllCategories();
}

export async function getCategory(id) {
  const cat = await categoryModel.getCategoryById(id);
  if (!cat) {
    throw new Error('Category not found.');
  }
  return cat;
}

export async function createCategory(data) {
  if (!data.category_name || data.category_name.trim() === '') {
    throw new Error('Category name is required.');
  }
  return await categoryModel.createCategory(data);
}

export async function updateCategory(id, data) {
  if (!data.category_name || data.category_name.trim() === '') {
    throw new Error('Category name is required.');
  }
  return await categoryModel.updateCategory(id, data);
}

export async function deleteCategory(id) {
  const schemeCount = await categoryModel.getSchemeCountForCategory(id);
  if (schemeCount > 0) {
    throw new Error(
      `Cannot delete category. There are ${schemeCount} scheme(s) associated with this category. Please reassign or delete them first.`
    );
  }
  return await categoryModel.deleteCategory(id);
}
