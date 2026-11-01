/**
 * API Client Module
 * Provides unified HTTP communication with automated CSRF token handling,
 * centralized error parsing, and session credentials.
 */

let csrfTokenCache = null;

export async function fetchCsrfToken() {
  try {
    const res = await fetch('/api/auth/csrf-token', { credentials: 'same-origin' });
    if (res.ok) {
      const data = await res.json();
      csrfTokenCache = data.csrfToken;
      return csrfTokenCache;
    }
  } catch (err) {
    console.warn('Unable to fetch CSRF token:', err);
  }
  return null;
}

export async function apiRequest(endpoint, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  // Attach CSRF token on mutating requests
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    if (!csrfTokenCache) {
      await fetchCsrfToken();
    }
    if (csrfTokenCache) {
      headers['x-csrf-token'] = csrfTokenCache;
    }
  }

  const fetchOptions = {
    method,
    headers,
    credentials: 'same-origin',
  };

  if (options.body && typeof options.body === 'object') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(endpoint, fetchOptions);
    const contentType = response.headers.get('content-type') || '';

    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { message: text };
    }

    if (!response.ok) {
      const error = new Error(data && data.message ? data.message : `HTTP Error ${response.status}`);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    throw err;
  }
}

export const api = {
  get: (endpoint, headers) => apiRequest(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) => apiRequest(endpoint, { method: 'POST', body, headers }),
  put: (endpoint, body, headers) => apiRequest(endpoint, { method: 'PUT', body, headers }),
  patch: (endpoint, body, headers) => apiRequest(endpoint, { method: 'PATCH', body, headers }),
  delete: (endpoint, headers) => apiRequest(endpoint, { method: 'DELETE', headers }),
};
