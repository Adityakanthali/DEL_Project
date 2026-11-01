/**
 * Request Validation Middleware
 * Validates request bodies and parameters to ensure data integrity and prevent bad inputs.
 */

export function validateRegister(req, res, next) {
  const { full_name, email, password, confirm_password } = req.body;

  if (!full_name || full_name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Full name is required (minimum 2 characters).',
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required.',
    });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 6 characters long.',
    });
  }

  if (confirm_password !== undefined && password !== confirm_password) {
    return res.status(400).json({
      success: false,
      message: 'Password and Confirm Password do not match.',
    });
  }

  next();
}

export function validateLogin(req, res, next) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Both email and password are required.',
    });
  }

  next();
}

export function validateSchemeInput(req, res, next) {
  const {
    scheme_name,
    short_description,
    description,
    benefits,
    category_id,
    start_date,
    end_date,
  } = req.body;

  if (!scheme_name || scheme_name.trim().length < 3) {
    return res.status(400).json({
      success: false,
      message: 'Scheme name is required (minimum 3 characters).',
    });
  }

  if (!short_description || short_description.trim().length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Short description is required (minimum 10 characters).',
    });
  }

  if (!category_id || isNaN(Number(category_id))) {
    return res.status(400).json({
      success: false,
      message: 'A valid category must be selected.',
    });
  }

  if (!start_date) {
    return res.status(400).json({
      success: false,
      message: 'Start date is required.',
    });
  }

  if (end_date && new Date(end_date) < new Date(start_date)) {
    return res.status(400).json({
      success: false,
      message: 'Closing date cannot be earlier than opening date.',
    });
  }

  next();
}
