/**
 * Schemes Presentation and Catalog Logic
 * Supports scheme catalog filtering, pagination, details view, bookmarks, and homepage feeds.
 */

import { api } from './api.js';
import { showToast, escapeHtml, formatDate, getStatusBadge } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  // Identify active page
  const pathname = window.location.pathname;

  if (pathname.includes('schemes.html')) {
    initSchemesCatalog();
  } else if (pathname.includes('scheme.html')) {
    initSchemeDetails();
  } else if (pathname.includes('saved-schemes.html')) {
    initSavedSchemes();
  } else if (pathname.includes('user-dashboard.html')) {
    initUserDashboard();
  } else if (pathname === '/' || pathname.endsWith('index.html')) {
    initHomePage();
  }
});

// ============================================================================
// 1. HOME PAGE LOGIC
// ============================================================================
async function initHomePage() {
  // Load dynamic portal statistics from MySQL
  try {
    const statsData = await api.get('/api/admin/dashboard/stats').catch(() => null);
    if (statsData && statsData.stats) {
      const s = statsData.stats;
      if (document.getElementById('stat-total-schemes')) document.getElementById('stat-total-schemes').textContent = s.publishedSchemes || 0;
      if (document.getElementById('stat-open-schemes')) document.getElementById('stat-open-schemes').textContent = s.openSchemes || 0;
      if (document.getElementById('stat-categories')) document.getElementById('stat-categories').textContent = s.categoryBreakdown ? s.categoryBreakdown.length : 0;
      if (document.getElementById('stat-users')) document.getElementById('stat-users').textContent = s.totalUsers || 0;
    }
  } catch (e) {
    console.warn('Home stats fetch error:', e);
  }

  // Load Categories Grid
  const categoriesContainer = document.getElementById('categories-container');
  if (categoriesContainer) {
    try {
      const res = await api.get('/api/categories');
      if (res && res.categories) {
        categoriesContainer.innerHTML = res.categories
          .map(
            (c) => `
          <a href="/schemes.html?categoryId=${c.category_id}" class="category-card">
            <div class="category-icon">🏛️</div>
            <div class="category-info">
              <h3>${escapeHtml(c.category_name)}</h3>
              <p>${escapeHtml(c.description || 'Explore available opportunities and subsidies.')}</p>
              <div class="category-count">${c.published_schemes || 0} Schemes Active</div>
            </div>
          </a>
        `
          )
          .join('');
      }
    } catch (e) {
      categoriesContainer.innerHTML = `<p class="text-muted">Unable to load categories.</p>`;
    }
  }

  // Load Featured Schemes
  const featuredContainer = document.getElementById('featured-schemes-container');
  if (featuredContainer) {
    try {
      const res = await api.get('/api/schemes/featured?limit=3');
      if (res && res.schemes && res.schemes.length > 0) {
        featuredContainer.innerHTML = res.schemes.map((s) => renderSchemeCard(s)).join('');
      } else {
        featuredContainer.innerHTML = `<p class="text-muted">No featured schemes currently available.</p>`;
      }
    } catch (e) {
      featuredContainer.innerHTML = `<p class="text-muted">Unable to load featured schemes.</p>`;
    }
  }

  // Load Closing Soon Schemes
  const closingSoonContainer = document.getElementById('closing-soon-container');
  if (closingSoonContainer) {
    try {
      const res = await api.get('/api/schemes/closing-soon?limit=3');
      if (res && res.schemes && res.schemes.length > 0) {
        closingSoonContainer.innerHTML = res.schemes
          .map((s) => renderSchemeCard(s, true))
          .join('');
      } else {
        closingSoonContainer.innerHTML = `<p class="text-muted">No open schemes with approaching deadlines.</p>`;
      }
    } catch (e) {
      closingSoonContainer.innerHTML = `<p class="text-muted">Unable to load closing-soon schemes.</p>`;
    }
  }

  // Home search bar
  const homeSearchForm = document.getElementById('home-search-form');
  if (homeSearchForm) {
    homeSearchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = document.getElementById('home-search-input')?.value.trim();
      window.location.href = `/schemes.html?search=${encodeURIComponent(query)}`;
    });
  }
}

// ============================================================================
// 2. SCHEMES CATALOG LOGIC (FILTERING, SEARCH, PAGINATION)
// ============================================================================
let currentCatalogParams = new URLSearchParams(window.location.search);

async function initSchemesCatalog() {
  const filterCategory = document.getElementById('filter-category');
  const filterState = document.getElementById('filter-state');
  const filterOccupation = document.getElementById('filter-occupation');
  const filterStatus = document.getElementById('filter-status');
  const filterMinAge = document.getElementById('filter-min-age');
  const filterMaxIncome = document.getElementById('filter-max-income');
  const filterSearch = document.getElementById('filter-search');
  const filterSort = document.getElementById('filter-sort');
  const btnReset = document.getElementById('btn-reset-filters');
  const catalogForm = document.getElementById('catalog-filters-form');

  // Populate Categories Dropdown
  if (filterCategory) {
    try {
      const res = await api.get('/api/categories');
      if (res && res.categories) {
        res.categories.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c.category_id;
          opt.textContent = `${c.category_name} (${c.published_schemes || 0})`;
          filterCategory.appendChild(opt);
        });
      }
    } catch (e) {
      console.warn('Failed to load categories into filter:', e);
    }
  }

  // Sync inputs from URL Query Params
  if (filterSearch) filterSearch.value = currentCatalogParams.get('search') || '';
  if (filterCategory && currentCatalogParams.get('categoryId')) filterCategory.value = currentCatalogParams.get('categoryId');
  if (filterState) filterState.value = currentCatalogParams.get('state') || '';
  if (filterOccupation) filterOccupation.value = currentCatalogParams.get('occupation') || '';
  if (filterStatus) filterStatus.value = currentCatalogParams.get('status') || '';
  if (filterMinAge) filterMinAge.value = currentCatalogParams.get('minAge') || '';
  if (filterMaxIncome) filterMaxIncome.value = currentCatalogParams.get('maxIncome') || '';
  if (filterSort) filterSort.value = currentCatalogParams.get('sortBy') || 'created_at';

  // Apply filters on submit or change
  if (catalogForm) {
    catalogForm.addEventListener('submit', (e) => {
      e.preventDefault();
      applyFilters();
    });
  }

  if (filterCategory) filterCategory.addEventListener('change', () => applyFilters());
  if (filterState) filterState.addEventListener('change', () => applyFilters());
  if (filterOccupation) filterOccupation.addEventListener('change', () => applyFilters());
  if (filterStatus) filterStatus.addEventListener('change', () => applyFilters());
  if (filterSort) filterSort.addEventListener('change', () => applyFilters());

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      window.location.href = '/schemes.html';
    });
  }

  // Initial Fetch
  fetchCatalogSchemes();
}

function applyFilters() {
  const params = new URLSearchParams();
  const search = document.getElementById('filter-search')?.value.trim();
  const categoryId = document.getElementById('filter-category')?.value;
  const state = document.getElementById('filter-state')?.value;
  const occupation = document.getElementById('filter-occupation')?.value;
  const status = document.getElementById('filter-status')?.value;
  const minAge = document.getElementById('filter-min-age')?.value;
  const maxIncome = document.getElementById('filter-max-income')?.value;
  const sortBy = document.getElementById('filter-sort')?.value;

  if (search) params.set('search', search);
  if (categoryId) params.set('categoryId', categoryId);
  if (state) params.set('state', state);
  if (occupation) params.set('occupation', occupation);
  if (status) params.set('status', status);
  if (minAge) params.set('minAge', minAge);
  if (maxIncome) params.set('maxIncome', maxIncome);
  if (sortBy) params.set('sortBy', sortBy);

  params.set('page', '1'); // Reset to page 1 on filter change
  currentCatalogParams = params;
  history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  fetchCatalogSchemes();
}

async function fetchCatalogSchemes() {
  const container = document.getElementById('schemes-list-container');
  const paginationContainer = document.getElementById('pagination-container');
  const countBadge = document.getElementById('total-schemes-count');

  if (!container) return;

  container.innerHTML = `
    <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
      <p class="text-muted">Loading matching government schemes from database...</p>
    </div>
  `;

  try {
    const res = await api.get(`/api/schemes?${currentCatalogParams.toString()}`);

    if (countBadge) {
      countBadge.textContent = `${res.total || 0} schemes found`;
    }

    if (!res.schemes || res.schemes.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1/-1; text-align: center; padding: 4rem 1.5rem; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">No schemes matched your criteria</h3>
          <p class="text-muted" style="margin-bottom: 1.25rem;">Try relaxing your filters or searching with different keywords.</p>
          <a href="/schemes.html" class="btn btn-secondary btn-sm">Clear All Filters</a>
        </div>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    container.innerHTML = res.schemes.map((s) => renderSchemeCard(s)).join('');

    // Render pagination
    if (paginationContainer && res.totalPages > 1) {
      renderPagination(paginationContainer, res.page, res.totalPages);
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
  } catch (err) {
    container.innerHTML = `
      <div style="grid-column: 1/-1;" class="alert alert-error">
        Error loading schemes: ${escapeHtml(err.message)}
      </div>
    `;
  }
}

function renderPagination(container, currentPage, totalPages) {
  let html = '';

  html += `<button class="page-btn" ${currentPage === 1 ? 'disabled' : ''} data-page="${currentPage - 1}">« Prev</button>`;

  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
      html += `<button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<span style="padding: 0 4px;">...</span>`;
    }
  }

  html += `<button class="page-btn" ${currentPage === totalPages ? 'disabled' : ''} data-page="${currentPage + 1}">Next »</button>`;

  container.innerHTML = html;

  container.querySelectorAll('.page-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const targetPage = e.target.getAttribute('data-page');
      if (targetPage && !e.target.disabled) {
        currentCatalogParams.set('page', targetPage);
        history.replaceState(null, '', `${window.location.pathname}?${currentCatalogParams.toString()}`);
        fetchCatalogSchemes();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });
  });
}

// ============================================================================
// 3. SCHEME DETAILS PAGE LOGIC
// ============================================================================
async function initSchemeDetails() {
  const params = new URLSearchParams(window.location.search);
  const schemeId = params.get('id');

  if (!schemeId) {
    window.location.href = '/schemes.html';
    return;
  }

  try {
    const data = await api.get(`/api/schemes/${schemeId}`);
    if (!data || !data.scheme) {
      showToast('Scheme not found.', 'error');
      return;
    }

    const s = data.scheme;

    // Populate metadata
    document.title = `${s.scheme_name} - Government Schemes Portal`;
    if (document.getElementById('detail-title')) document.getElementById('detail-title').textContent = s.scheme_name;
    if (document.getElementById('detail-category')) document.getElementById('detail-category').textContent = s.category_name;
    if (document.getElementById('detail-status')) document.getElementById('detail-status').innerHTML = getStatusBadge(s.application_status);
    if (document.getElementById('detail-scope')) document.getElementById('detail-scope').textContent = s.applicable_state ? `State: ${s.applicable_state}` : `Scope: ${s.applicable_scope}`;
    if (document.getElementById('detail-short-desc')) document.getElementById('detail-short-desc').textContent = s.short_description;
    if (document.getElementById('detail-desc')) document.getElementById('detail-desc').textContent = s.description;
    if (document.getElementById('detail-benefits')) document.getElementById('detail-benefits').textContent = s.benefits;
    if (document.getElementById('detail-start-date')) document.getElementById('detail-start-date').textContent = formatDate(s.start_date);
    if (document.getElementById('detail-end-date')) document.getElementById('detail-end-date').textContent = s.end_date ? formatDate(s.end_date) : 'Open-ended';
    if (document.getElementById('detail-verified')) document.getElementById('detail-verified').textContent = formatDate(s.source_last_verified_at);

    // Official links
    const appLinkBtn = document.getElementById('btn-official-apply');
    if (appLinkBtn) {
      if (s.official_application_url) {
        appLinkBtn.href = s.official_application_url;
        appLinkBtn.style.display = 'inline-flex';
      } else {
        appLinkBtn.style.display = 'none';
      }
    }

    const sourceLink = document.getElementById('detail-source-link');
    if (sourceLink) {
      if (s.official_source_url) {
        sourceLink.href = s.official_source_url;
        sourceLink.textContent = 'View Official Gazette / Guidelines';
      } else {
        sourceLink.textContent = 'Verified internal notification record';
      }
    }

    // Bookmark / Save button
    const btnSave = document.getElementById('btn-save-scheme');
    if (btnSave) {
      updateBookmarkButton(btnSave, s.isSaved);
      btnSave.addEventListener('click', async () => {
        try {
          if (btnSave.getAttribute('data-saved') === 'true') {
            await api.delete(`/api/user/saved-schemes/${s.scheme_id}`);
            updateBookmarkButton(btnSave, false);
            showToast('Scheme removed from your saved list.', 'info');
          } else {
            await api.post(`/api/user/saved-schemes/${s.scheme_id}`);
            updateBookmarkButton(btnSave, true);
            showToast('Scheme added to your saved list!', 'success');
          }
        } catch (err) {
          if (err.status === 401) {
            showToast('Please log in as a citizen to save schemes.', 'error');
            setTimeout(() => (window.location.href = '/login.html'), 800);
          } else {
            showToast(err.message, 'error');
          }
        }
      });
    }

    // Criteria List
    const criteriaListContainer = document.getElementById('detail-criteria-list');
    if (criteriaListContainer) {
      if (!s.criteria || s.criteria.length === 0) {
        criteriaListContainer.innerHTML = `<tr><td colspan="4" class="text-muted">No specific restrictions configured. Open to general public.</td></tr>`;
      } else {
        criteriaListContainer.innerHTML = s.criteria
          .map(
            (c) => `
          <tr>
            <td><strong>${escapeHtml(c.criterion_type.replace('_', ' ').toUpperCase())}</strong></td>
            <td><code>${escapeHtml(c.operator)} ${escapeHtml(c.criterion_value)}</code></td>
            <td>${c.is_mandatory ? '<span class="badge badge-mandatory">Mandatory</span>' : '<span class="badge badge-optional">Optional</span>'}</td>
            <td>${escapeHtml(c.description || 'Condition required for applicant qualification.')}</td>
          </tr>
        `
          )
          .join('');
      }
    }

    // Required Documents List
    const docsContainer = document.getElementById('detail-documents-list');
    if (docsContainer) {
      if (!s.documents || s.documents.length === 0) {
        docsContainer.innerHTML = `<li class="text-muted">No special supporting documents specified. Standard identity card may apply.</li>`;
      } else {
        docsContainer.innerHTML = s.documents
          .map(
            (d) => `
          <li style="padding: 0.65rem 0; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
            <div>
              <strong>${escapeHtml(d.document_name)}</strong>
              ${d.description ? `<p style="font-size: 0.82rem; color: var(--text-muted);">${escapeHtml(d.description)}</p>` : ''}
            </div>
            ${d.is_mandatory ? '<span class="badge badge-mandatory">Required</span>' : '<span class="badge badge-optional">If Applicable</span>'}
          </li>
        `
          )
          .join('');
      }
    }

    // Initialize the integrated eligibility checker on this page
    initEmbeddedEligibilityChecker(s.scheme_id);
  } catch (err) {
    showToast(`Error: ${err.message}`, 'error');
  }
}

function updateBookmarkButton(btn, isSaved) {
  if (isSaved) {
    btn.setAttribute('data-saved', 'true');
    btn.className = 'btn btn-secondary';
    btn.innerHTML = '★ Saved in My Schemes';
  } else {
    btn.setAttribute('data-saved', 'false');
    btn.className = 'btn btn-outline';
    btn.innerHTML = '☆ Bookmark Scheme';
  }
}

// Embedded Eligibility Checker on Scheme Details page
function initEmbeddedEligibilityChecker(schemeId) {
  const form = document.getElementById('embedded-eligibility-form');
  const resultCard = document.getElementById('embedded-eligibility-result');

  if (!form) return;

  // Attempt to prefill values if citizen is logged in
  api.get('/api/user/profile')
    .then((res) => {
      if (res && res.profile) {
        const p = res.profile;
        if (p.age && document.getElementById('check-age')) document.getElementById('check-age').value = p.age;
        if (p.occupation && document.getElementById('check-occupation')) document.getElementById('check-occupation').value = p.occupation;
        if (p.annual_income && document.getElementById('check-income')) document.getElementById('check-income').value = p.annual_income;
        if (p.state && document.getElementById('check-state')) document.getElementById('check-state').value = p.state;
        if (p.education_level && document.getElementById('check-education')) document.getElementById('check-education').value = p.education_level;
        if (p.beneficiary_group && document.getElementById('check-beneficiary')) document.getElementById('check-beneficiary').value = p.beneficiary_group;
      }
    })
    .catch(() => {});

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');

    const profile = {
      age: document.getElementById('check-age')?.value || null,
      occupation: document.getElementById('check-occupation')?.value || null,
      annual_income: document.getElementById('check-income')?.value || null,
      state: document.getElementById('check-state')?.value || null,
      education_level: document.getElementById('check-education')?.value || null,
      beneficiary_group: document.getElementById('check-beneficiary')?.value || null,
    };

    try {
      btn.disabled = true;
      btn.textContent = 'Evaluating criteria in MySQL...';

      const res = await api.post('/api/eligibility/check', {
        schemeId,
        profile,
      });

      renderEligibilityEvaluation(resultCard, res);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = 'Check My Eligibility';
    }
  });
}

function renderEligibilityEvaluation(container, evaluation) {
  if (!container) return;
  container.style.display = 'block';

  let boxClass = 'more-info';
  let icon = 'ℹ️';

  if (evaluation.status === 'Likely Eligible') {
    boxClass = 'likely';
    icon = '✅';
  } else if (evaluation.status === 'Not Eligible') {
    boxClass = 'not-eligible';
    icon = '❌';
  }

  let criteriaTable = '';
  if (evaluation.criteriaResults && evaluation.criteriaResults.length > 0) {
    criteriaTable = `
      <h4 style="margin: 1.25rem 0 0.5rem 0; font-size: 0.95rem;">Rule-by-Rule Assessment:</h4>
      <div class="data-table-container">
        <table class="data-table">
          <thead>
            <tr>
              <th>Condition</th>
              <th>Rule</th>
              <th>Result</th>
              <th>Explanation</th>
            </tr>
          </thead>
          <tbody>
            ${evaluation.criteriaResults
              .map((r) => {
                let badge = '<span class="badge badge-upcoming">Missing Info</span>';
                if (r.status === 'passed') badge = '<span class="badge badge-open">Satisfied</span>';
                if (r.status === 'failed') badge = '<span class="badge badge-closed">Unsatisfied</span>';
                return `
                <tr>
                  <td><strong>${escapeHtml(r.criterion_type.replace('_', ' ').toUpperCase())}</strong></td>
                  <td><code>${escapeHtml(r.operator)} ${escapeHtml(r.target_value)}</code></td>
                  <td>${badge}</td>
                  <td>${escapeHtml(r.explanation)}</td>
                </tr>
              `;
              })
              .join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  container.innerHTML = `
    <div class="eligibility-box ${boxClass}">
      <div style="display: flex; align-items: flex-start; gap: 0.75rem;">
        <span style="font-size: 1.75rem;">${icon}</span>
        <div>
          <h3 style="font-size: 1.2rem; margin-bottom: 0.25rem;">${escapeHtml(evaluation.status)}</h3>
          <p style="font-size: 0.92rem;">${escapeHtml(evaluation.message)}</p>
        </div>
      </div>
      ${criteriaTable}
      <p style="font-size: 0.78rem; margin-top: 1rem; opacity: 0.85;">
        <em>${escapeHtml(evaluation.disclaimer)}</em>
      </p>
    </div>
  `;

  container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ============================================================================
// 4. SAVED SCHEMES PAGE LOGIC
// ============================================================================
async function initSavedSchemes() {
  const container = document.getElementById('saved-schemes-list');
  if (!container) return;

  try {
    const res = await api.get('/api/user/saved-schemes');

    if (!res.savedSchemes || res.savedSchemes.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 3rem 1.5rem; background: #fff; border-radius: 8px; border: 1px dashed #cbd5e1;">
          <h3 style="color: var(--primary); margin-bottom: 0.5rem;">No Bookmarked Schemes Yet</h3>
          <p class="text-muted" style="margin-bottom: 1.5rem;">Browse available schemes and bookmark those that interest you for quick access.</p>
          <a href="/schemes.html" class="btn btn-primary">Browse All Schemes</a>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="schemes-grid">
        ${res.savedSchemes
          .map(
            (s) => `
          <div class="scheme-card">
            <div class="scheme-card-header">
              <span class="scheme-category-badge">${escapeHtml(s.category_name)}</span>
              ${getStatusBadge(s.application_status)}
            </div>
            <h3 class="scheme-title">${escapeHtml(s.scheme_name)}</h3>
            <p class="scheme-desc">${escapeHtml(s.short_description)}</p>
            <div class="scheme-meta-list">
              <span class="scheme-meta-item">📅 Saved: ${formatDate(s.saved_at)}</span>
              <span class="scheme-meta-item">⏱ Closing: ${s.end_date ? formatDate(s.end_date) : 'Ongoing'}</span>
            </div>
            <div class="scheme-card-footer">
              <a href="/scheme.html?id=${s.scheme_id}" class="btn btn-primary btn-sm">View Details</a>
              <button class="btn btn-danger btn-sm btn-remove-saved" data-id="${s.scheme_id}">Remove</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;

    container.querySelectorAll('.btn-remove-saved').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        try {
          await api.delete(`/api/user/saved-schemes/${id}`);
          showToast('Scheme removed from bookmarks.', 'info');
          initSavedSchemes();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/login.html';
    } else {
      container.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    }
  }
}

// ============================================================================
// 5. CITIZEN DASHBOARD LOGIC
// ============================================================================
async function initUserDashboard() {
  try {
    const [profileRes, savedRes] = await Promise.all([
      api.get('/api/user/profile'),
      api.get('/api/user/saved-schemes'),
    ]);

    if (profileRes && profileRes.profile) {
      const p = profileRes.profile;
      if (document.getElementById('dash-user-name')) document.getElementById('dash-user-name').textContent = p.full_name;
      if (document.getElementById('dash-user-email')) document.getElementById('dash-user-email').textContent = p.email;
      if (document.getElementById('dash-user-state')) document.getElementById('dash-user-state').textContent = p.state || 'Not specified';
      if (document.getElementById('dash-user-occ')) document.getElementById('dash-user-occ').textContent = p.occupation || 'Not specified';
      if (document.getElementById('dash-user-age')) document.getElementById('dash-user-age').textContent = p.age !== null ? `${p.age} years` : 'Date of birth not provided';
    }

    if (savedRes && savedRes.savedSchemes) {
      if (document.getElementById('dash-saved-count')) document.getElementById('dash-saved-count').textContent = savedRes.savedSchemes.length;

      const preview = document.getElementById('dash-saved-preview');
      if (preview) {
        if (savedRes.savedSchemes.length === 0) {
          preview.innerHTML = `<p class="text-muted">You have not bookmarked any schemes yet.</p>`;
        } else {
          preview.innerHTML = savedRes.savedSchemes
            .slice(0, 3)
            .map(
              (s) => `
            <div style="padding: 0.75rem; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center;">
              <div>
                <strong>${escapeHtml(s.scheme_name)}</strong>
                <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(s.category_name)} | ${getStatusBadge(s.application_status)}</div>
              </div>
              <a href="/scheme.html?id=${s.scheme_id}" class="btn btn-secondary btn-sm">Details</a>
            </div>
          `
            )
            .join('');
        }
      }
    }
  } catch (err) {
    if (err.status === 401) {
      window.location.href = '/login.html';
    }
  }
}

// Reusable card template for catalog and home
function renderSchemeCard(s, isUrgent = false) {
  let urgencyPill = '';
  if (isUrgent && s.days_remaining !== null) {
    urgencyPill = `<span style="color: var(--accent-red); font-size: 0.78rem; font-weight: 700;">⚠️ ${s.days_remaining} days left</span>`;
  }

  return `
    <div class="scheme-card">
      <div class="scheme-card-header">
        <span class="scheme-category-badge">${escapeHtml(s.category_name)}</span>
        ${getStatusBadge(s.application_status)}
      </div>
      <h3 class="scheme-title">${escapeHtml(s.scheme_name)}</h3>
      <p class="scheme-desc">${escapeHtml(s.short_description)}</p>
      <div class="scheme-benefits-box">
        <strong>Benefit:</strong> ${escapeHtml(s.benefits ? s.benefits.substring(0, 100) + '...' : 'Direct welfare support')}
      </div>
      <div class="scheme-meta-list">
        <span class="scheme-meta-item">📍 ${escapeHtml(s.applicable_state || s.applicable_scope)}</span>
        <span class="scheme-meta-item">⏱ Closing: ${s.end_date ? formatDate(s.end_date) : 'Ongoing'}</span>
        ${urgencyPill}
      </div>
      <div class="scheme-card-footer">
        <a href="/scheme.html?id=${s.scheme_id}" class="btn btn-primary btn-sm">Check Eligibility & Details →</a>
      </div>
    </div>
  `;
}
