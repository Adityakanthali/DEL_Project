/**
 * Authentication & Profile Client Script
 */

import { api } from './api.js';
import { showToast, escapeHtml } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Citizen Registration Form
  const registerForm = document.getElementById('form-register');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      const errorAlert = document.getElementById('register-error');

      if (errorAlert) errorAlert.style.display = 'none';

      const full_name = document.getElementById('full_name')?.value.trim();
      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;
      const confirm_password = document.getElementById('confirm_password')?.value;

      if (password !== confirm_password) {
        if (errorAlert) {
          errorAlert.textContent = 'Passwords do not match.';
          errorAlert.style.display = 'block';
        }
        return;
      }

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Creating account...';

        const res = await api.post('/api/auth/register', {
          full_name,
          email,
          password,
          confirm_password,
        });

        showToast('Registration successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/user-dashboard.html';
        }, 800);
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Registration failed.';
          errorAlert.style.display = 'block';
        } else {
          showToast(err.message, 'error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Citizen Account';
      }
    });
  }

  // 2. Citizen Login Form
  const loginForm = document.getElementById('form-login');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      const errorAlert = document.getElementById('login-error');

      if (errorAlert) errorAlert.style.display = 'none';

      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Authenticating...';

        await api.post('/api/auth/login', { email, password });

        showToast('Login successful! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = '/user-dashboard.html';
        }, 600);
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Invalid email or password.';
          errorAlert.style.display = 'block';
        } else {
          showToast(err.message, 'error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In';
      }
    });
  }

  // 3. Admin Login Form
  const adminLoginForm = document.getElementById('form-admin-login');
  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = adminLoginForm.querySelector('button[type="submit"]');
      const errorAlert = document.getElementById('admin-login-error');

      if (errorAlert) errorAlert.style.display = 'none';

      const email = document.getElementById('email')?.value.trim();
      const password = document.getElementById('password')?.value;

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Verifying admin credentials...';

        await api.post('/api/auth/admin-login', { email, password });

        showToast('Administrator authenticated! Opening dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/admin-dashboard.html';
        }, 600);
      } catch (err) {
        if (errorAlert) {
          errorAlert.textContent = err.message || 'Administrative verification failed.';
          errorAlert.style.display = 'block';
        } else {
          showToast(err.message, 'error');
        }
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign In to Admin Panel';
      }
    });
  }

  // 4. Citizen Profile Management
  const profileForm = document.getElementById('form-profile');
  if (profileForm) {
    loadProfileData();

    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const submitBtn = profileForm.querySelector('button[type="submit"]');

      const profilePayload = {
        full_name: document.getElementById('full_name')?.value.trim(),
        date_of_birth: document.getElementById('date_of_birth')?.value || null,
        state: document.getElementById('state')?.value || null,
        district: document.getElementById('district')?.value.trim() || null,
        occupation: document.getElementById('occupation')?.value || null,
        annual_income: document.getElementById('annual_income')?.value || null,
        education_level: document.getElementById('education_level')?.value || null,
        beneficiary_group: document.getElementById('beneficiary_group')?.value || null,
      };

      try {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving changes...';

        const res = await api.put('/api/user/profile', profilePayload);

        showToast(res.message || 'Profile updated successfully!', 'success');
        if (res.profile && res.profile.age !== null) {
          const ageDisplay = document.getElementById('calculated-age-display');
          if (ageDisplay) {
            ageDisplay.textContent = `Calculated Age: ${res.profile.age} years`;
          }
        }
      } catch (err) {
        showToast(err.message, 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Save Profile Details';
      }
    });
  }
});

async function loadProfileData() {
  try {
    const data = await api.get('/api/user/profile');
    if (!data || !data.profile) return;

    const p = data.profile;
    if (document.getElementById('full_name')) document.getElementById('full_name').value = p.full_name || '';
    if (document.getElementById('email')) document.getElementById('email').value = p.email || '';
    if (document.getElementById('date_of_birth')) document.getElementById('date_of_birth').value = p.date_of_birth || '';
    if (document.getElementById('state')) document.getElementById('state').value = p.state || '';
    if (document.getElementById('district')) document.getElementById('district').value = p.district || '';
    if (document.getElementById('occupation')) document.getElementById('occupation').value = p.occupation || '';
    if (document.getElementById('annual_income')) document.getElementById('annual_income').value = p.annual_income || '';
    if (document.getElementById('education_level')) document.getElementById('education_level').value = p.education_level || '';
    if (document.getElementById('beneficiary_group')) document.getElementById('beneficiary_group').value = p.beneficiary_group || '';

    const ageDisplay = document.getElementById('calculated-age-display');
    if (ageDisplay && p.age !== null) {
      ageDisplay.textContent = `Calculated Age: ${p.age} years`;
    }
  } catch (err) {
    console.warn('Profile load failed (user might not be authenticated):', err);
    if (err.status === 401) {
      window.location.href = '/login.html';
    }
  }
}
