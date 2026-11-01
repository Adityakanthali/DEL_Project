/**
 * Main Frontend Module
 * Navigation, session display, toast system, and shared presentation helpers.
 */

import { api } from './api.js';

// Global toast notification system
export function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Session state check and navbar synchronization
export async function initNavbar() {
  const navActions = document.getElementById('nav-actions');
  const navToggle = document.getElementById('nav-toggle');
  const navMenu = document.getElementById('nav-menu');

  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('active');
    });
  }

  if (!navActions) return;

  try {
    const sessionData = await api.get('/api/auth/me');

    if (sessionData && sessionData.user) {
      // Citizen logged in
      navActions.innerHTML = `
        <a href="/user-dashboard.html" class="btn btn-secondary btn-sm" title="My Dashboard">
          👤 ${escapeHtml(sessionData.user.full_name)}
        </a>
        <button id="btn-logout" class="btn btn-primary btn-sm">Logout</button>
      `;

      document.getElementById('btn-logout')?.addEventListener('click', async () => {
        try {
          await api.post('/api/auth/logout');
          showToast('Logged out successfully.', 'success');
          setTimeout(() => (window.location.href = '/index.html'), 500);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    } else if (sessionData && sessionData.admin) {
      // Admin logged in
      navActions.innerHTML = `
        <a href="/admin-dashboard.html" class="btn btn-accent btn-sm" title="Admin Dashboard">
          🛡️ Admin (${escapeHtml(sessionData.admin.full_name)})
        </a>
        <button id="btn-logout" class="btn btn-primary btn-sm">Logout</button>
      `;

      document.getElementById('btn-logout')?.addEventListener('click', async () => {
        try {
          await api.post('/api/auth/logout');
          showToast('Administrator logged out.', 'success');
          setTimeout(() => (window.location.href = '/admin-login.html'), 500);
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    } else {
      // Public / Guest
      navActions.innerHTML = `
        <a href="/login.html" class="btn btn-secondary btn-sm">Citizen Login</a>
        <a href="/register.html" class="btn btn-primary btn-sm">Register</a>
      `;
    }
  } catch (err) {
    console.warn('Navbar session sync failed:', err);
  }
}

// Security HTML escape utility to prevent XSS
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Format currency
export function formatCurrency(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return 'N/A';
  return '₹ ' + Number(amount).toLocaleString('en-IN');
}

// Format date
export function formatDate(dateStr) {
  if (!dateStr) return 'Not Specified';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Generate application status badge HTML
export function getStatusBadge(status) {
  const s = String(status || '').toLowerCase();
  if (s === 'open') {
    return `<span class="badge badge-open">● Open</span>`;
  } else if (s === 'upcoming') {
    return `<span class="badge badge-upcoming">🕒 Upcoming</span>`;
  } else if (s === 'closed') {
    return `<span class="badge badge-closed">✖ Closed</span>`;
  } else if (s === 'draft') {
    return `<span class="badge badge-draft">📝 Draft</span>`;
  }
  return `<span class="badge badge-closed">${escapeHtml(status)}</span>`;
}

// Run navbar initialization when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
});
