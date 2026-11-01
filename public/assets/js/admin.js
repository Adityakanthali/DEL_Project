/**
 * Admin Panel Management Script
 * Handles Admin authentication guard, dashboard charts (Chart.js),
 * scheme CRUD, category management, dynamic criteria/documents form builder, and audit logs.
 */

import { api } from './api.js';
import { showToast, escapeHtml, formatDate, getStatusBadge } from './main.js';

let categoryChartInstance = null;
let statusChartInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Guard admin pages against unauthorized access
  const isAuth = await verifyAdminSession();
  if (!isAuth) return;

  const pathname = window.location.pathname;

  if (pathname.includes('admin-dashboard.html')) {
    initAdminDashboard();
  } else if (pathname.includes('admin-schemes.html')) {
    initAdminSchemesTable();
  } else if (pathname.includes('admin-scheme-form.html')) {
    initAdminSchemeForm();
  } else if (pathname.includes('admin-categories.html')) {
    initAdminCategories();
  } else if (pathname.includes('admin-audit-logs.html')) {
    initAdminAuditLogs();
  }
});

/**
 * Ensures user has an active administrator session.
 */
async function verifyAdminSession() {
  try {
    const data = await api.get('/api/auth/me');
    if (!data.admin) {
      window.location.href = '/admin-login.html';
      return false;
    }
    const adminNameEl = document.getElementById('admin-display-name');
    if (adminNameEl) {
      adminNameEl.textContent = data.admin.full_name;
    }
    return true;
  } catch (err) {
    window.location.href = '/admin-login.html';
    return false;
  }
}

// ============================================================================
// 1. ADMIN DASHBOARD
// ============================================================================
async function initAdminDashboard() {
  try {
    const res = await api.get('/api/admin/dashboard/stats');
    if (!res || !res.stats) return;

    const s = res.stats;

    // Populate KPI Cards
    if (document.getElementById('kpi-total-schemes')) document.getElementById('kpi-total-schemes').textContent = s.totalSchemes;
    if (document.getElementById('kpi-published-schemes')) document.getElementById('kpi-published-schemes').textContent = s.publishedSchemes;
    if (document.getElementById('kpi-open-schemes')) document.getElementById('kpi-open-schemes').textContent = s.openSchemes;
    if (document.getElementById('kpi-upcoming-schemes')) document.getElementById('kpi-upcoming-schemes').textContent = s.upcomingSchemes;
    if (document.getElementById('kpi-closed-schemes')) document.getElementById('kpi-closed-schemes').textContent = s.closedSchemes;
    if (document.getElementById('kpi-total-users')) document.getElementById('kpi-total-users').textContent = s.totalUsers;

    // Render Charts using Chart.js if library is available
    if (window.Chart) {
      renderCategoryChart(s.categoryBreakdown || []);
      renderStatusChart(s);
    }

    // Load Recent Audit Log preview
    const auditRes = await api.get('/api/admin/audit-logs?limit=5');
    const auditPreview = document.getElementById('dashboard-audit-preview');
    if (auditPreview && auditRes.logs) {
      auditPreview.innerHTML = auditRes.logs
        .map(
          (l) => `
        <tr>
          <td><strong>${escapeHtml(l.admin_name || 'System')}</strong></td>
          <td><span class="badge badge-scope">${escapeHtml(l.action_type)}</span></td>
          <td>${escapeHtml(l.description)}</td>
          <td>${formatDate(l.changed_at)}</td>
        </tr>
      `
        )
        .join('');
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
}

function renderCategoryChart(categories) {
  const ctx = document.getElementById('chart-categories')?.getContext('2d');
  if (!ctx) return;

  if (categoryChartInstance) categoryChartInstance.destroy();

  const labels = categories.map((c) => c.category_name.split('&')[0].trim());
  const totals = categories.map((c) => c.total_schemes);
  const published = categories.map((c) => c.published_schemes);

  categoryChartInstance = new window.Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Total Schemes',
          data: totals,
          backgroundColor: '#0f2e59',
          borderRadius: 4,
        },
        {
          label: 'Published',
          data: published,
          backgroundColor: '#059669',
          borderRadius: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'top' },
      },
      scales: {
        y: { beginAtZero: true, ticks: { precision: 0 } },
      },
    },
  });
}

function renderStatusChart(stats) {
  const ctx = document.getElementById('chart-status')?.getContext('2d');
  if (!ctx) return;

  if (statusChartInstance) statusChartInstance.destroy();

  statusChartInstance = new window.Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Open', 'Upcoming', 'Closed', 'Drafts / Unpublished'],
      datasets: [
        {
          data: [
            stats.openSchemes || 0,
            stats.upcomingSchemes || 0,
            stats.closedSchemes || 0,
            (stats.draftSchemes || 0) + (stats.unpublishedSchemes || 0),
          ],
          backgroundColor: ['#059669', '#2563eb', '#64748b', '#d97706'],
          hoverOffset: 4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { position: 'bottom' },
      },
    },
  });
}

// ============================================================================
// 2. ADMIN SCHEMES TABLE (SEARCH, FILTER, PUBLISH/UNPUBLISH, DELETE)
// ============================================================================
let adminSchemesParams = new URLSearchParams({ page: '1', limit: '15' });

async function initAdminSchemesTable() {
  const searchInput = document.getElementById('admin-scheme-search');
  const statusFilter = document.getElementById('admin-scheme-status-filter');
  const categoryFilter = document.getElementById('admin-scheme-category-filter');

  // Load category options into filter
  if (categoryFilter) {
    try {
      const res = await api.get('/api/categories');
      if (res && res.categories) {
        res.categories.forEach((c) => {
          const opt = document.createElement('option');
          opt.value = c.category_id;
          opt.textContent = c.category_name;
          categoryFilter.appendChild(opt);
        });
      }
    } catch (e) {}
  }

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      adminSchemesParams.set('search', e.target.value.trim());
      adminSchemesParams.set('page', '1');
      loadAdminSchemes();
    });
  }

  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      adminSchemesParams.set('status', e.target.value);
      adminSchemesParams.set('page', '1');
      loadAdminSchemes();
    });
  }

  if (categoryFilter) {
    categoryFilter.addEventListener('change', (e) => {
      adminSchemesParams.set('categoryId', e.target.value);
      adminSchemesParams.set('page', '1');
      loadAdminSchemes();
    });
  }

  loadAdminSchemes();
}

async function loadAdminSchemes() {
  const tbody = document.getElementById('admin-schemes-tbody');
  const paginationContainer = document.getElementById('admin-schemes-pagination');

  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align: center; padding: 2rem;">Loading scheme records from MySQL...</td></tr>`;

  try {
    const res = await api.get(`/api/admin/schemes?${adminSchemesParams.toString()}`);

    if (!res.schemes || res.schemes.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-muted" style="text-align: center; padding: 2rem;">No schemes found matching the criteria.</td></tr>`;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    tbody.innerHTML = res.schemes
      .map(
        (s) => `
      <tr>
        <td><strong>#${s.scheme_id}</strong></td>
        <td>
          <strong>${escapeHtml(s.scheme_name)}</strong>
          <div style="font-size: 0.8rem; color: var(--text-muted);">${escapeHtml(s.applicable_state ? 'State: ' + s.applicable_state : s.applicable_scope)}</div>
        </td>
        <td>${escapeHtml(s.category_name)}</td>
        <td>
          <div style="font-size: 0.82rem;">Start: ${formatDate(s.start_date)}</div>
          <div style="font-size: 0.82rem;">End: ${s.end_date ? formatDate(s.end_date) : 'Ongoing'}</div>
        </td>
        <td>
          <div>${getStatusBadge(s.calculated_status)}</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); text-transform: uppercase; margin-top: 2px;">Status: ${s.publication_status}</div>
        </td>
        <td>
          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;">
            <a href="/scheme.html?id=${s.scheme_id}" target="_blank" class="btn btn-secondary btn-sm" title="View Public Page">👁</a>
            <a href="/admin-scheme-form.html?id=${s.scheme_id}" class="btn btn-primary btn-sm" title="Edit Scheme">✏️ Edit</a>
            <button class="btn btn-sm ${s.publication_status === 'published' ? 'btn-secondary' : 'btn-success'} btn-toggle-pub"
              data-id="${s.scheme_id}"
              data-current="${s.publication_status}">
              ${s.publication_status === 'published' ? 'Unpublish' : 'Publish'}
            </button>
            <button class="btn btn-danger btn-sm btn-delete-scheme" data-id="${s.scheme_id}" data-name="${escapeHtml(s.scheme_name)}">🗑</button>
          </div>
        </td>
      </tr>
    `
      )
      .join('');

    // Toggle publish buttons
    tbody.querySelectorAll('.btn-toggle-pub').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const current = e.target.getAttribute('data-current');
        const nextStatus = current === 'published' ? 'unpublished' : 'published';

        try {
          await api.patch(`/api/admin/schemes/${id}/publication`, { status: nextStatus });
          showToast(`Scheme status updated to "${nextStatus}".`, 'success');
          loadAdminSchemes();
        } catch (err) {
          showToast(err.message, 'error');
        }
      });
    });

    // Delete buttons
    tbody.querySelectorAll('.btn-delete-scheme').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const name = e.target.getAttribute('data-name');

        if (confirm(`Are you sure you want to delete scheme #${id} ("${name}")?\n\nThis will remove the scheme and its associated criteria and documents, while recording the deletion in the audit log.`)) {
          try {
            await api.delete(`/api/admin/schemes/${id}`);
            showToast('Scheme deleted successfully.', 'info');
            loadAdminSchemes();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });

    // Pagination
    if (paginationContainer && res.totalPages > 1) {
      let pageHtml = '';
      for (let i = 1; i <= res.totalPages; i++) {
        pageHtml += `<button class="page-btn ${i === res.page ? 'active' : ''}" data-page="${i}">${i}</button>`;
      }
      paginationContainer.innerHTML = pageHtml;
      paginationContainer.querySelectorAll('.page-btn').forEach((pBtn) => {
        pBtn.addEventListener('click', (e) => {
          adminSchemesParams.set('page', e.target.getAttribute('data-page'));
          loadAdminSchemes();
        });
      });
    } else if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="alert alert-error">${escapeHtml(err.message)}</td></tr>`;
  }
}

// ============================================================================
// 3. ADMIN SCHEME FORM (ADD / EDIT WITH DYNAMIC CRITERIA & DOCUMENTS BUILDER)
// ============================================================================
async function initAdminSchemeForm() {
  const form = document.getElementById('admin-scheme-form');
  const categorySelect = document.getElementById('form-category');
  const criteriaContainer = document.getElementById('criteria-dynamic-container');
  const documentsContainer = document.getElementById('documents-dynamic-container');
  const btnAddCriterion = document.getElementById('btn-add-criterion');
  const btnAddDocument = document.getElementById('btn-add-document');

  if (!form) return;

  // Load Categories into select
  try {
    const res = await api.get('/api/categories');
    if (res && res.categories && categorySelect) {
      categorySelect.innerHTML = '<option value="">Select a Category...</option>';
      res.categories.forEach((c) => {
        const opt = document.createElement('option');
        opt.value = c.category_id;
        opt.textContent = c.category_name;
        categorySelect.appendChild(opt);
      });
    }
  } catch (e) {}

  // Check if Editing existing scheme (?id=...)
  const params = new URLSearchParams(window.location.search);
  const editSchemeId = params.get('id');

  if (editSchemeId) {
    document.getElementById('form-page-title').textContent = `Edit Scheme #${editSchemeId}`;
    loadSchemeForEditing(editSchemeId);
  } else {
    // Add default initial criterion and document row
    addCriterionRow(criteriaContainer);
    addDocumentRow(documentsContainer);
  }

  // Hook dynamic row addition buttons
  if (btnAddCriterion) {
    btnAddCriterion.addEventListener('click', () => addCriterionRow(criteriaContainer));
  }

  if (btnAddDocument) {
    btnAddDocument.addEventListener('click', () => addDocumentRow(documentsContainer));
  }

  // Handle Form Submission
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    // Collect Criteria Rows
    const criteria = [];
    criteriaContainer.querySelectorAll('.dynamic-criterion-row').forEach((row) => {
      const type = row.querySelector('.crit-type')?.value;
      const op = row.querySelector('.crit-op')?.value;
      const val = row.querySelector('.crit-val')?.value.trim();
      const mandatory = row.querySelector('.crit-mandatory')?.checked ? 1 : 0;
      const desc = row.querySelector('.crit-desc')?.value.trim();

      if (type && op && val !== '') {
        criteria.push({
          criterion_type: type,
          operator: op,
          criterion_value: val,
          is_mandatory: mandatory,
          description: desc || `${type} ${op} ${val}`,
        });
      }
    });

    // Collect Document Rows
    const documents = [];
    documentsContainer.querySelectorAll('.dynamic-document-row').forEach((row) => {
      const name = row.querySelector('.doc-name')?.value.trim();
      const desc = row.querySelector('.doc-desc')?.value.trim();
      const mandatory = row.querySelector('.doc-mandatory')?.checked ? 1 : 0;

      if (name) {
        documents.push({
          document_name: name,
          description: desc,
          is_mandatory: mandatory,
        });
      }
    });

    const payload = {
      scheme_name: document.getElementById('form-name')?.value.trim(),
      category_id: document.getElementById('form-category')?.value,
      short_description: document.getElementById('form-short-desc')?.value.trim(),
      description: document.getElementById('form-desc')?.value.trim(),
      benefits: document.getElementById('form-benefits')?.value.trim(),
      start_date: document.getElementById('form-start-date')?.value,
      end_date: document.getElementById('form-end-date')?.value || null,
      applicable_scope: document.getElementById('form-scope')?.value || 'National',
      applicable_state: document.getElementById('form-state')?.value.trim() || null,
      official_application_url: document.getElementById('form-app-url')?.value.trim() || null,
      official_source_url: document.getElementById('form-source-url')?.value.trim() || null,
      publication_status: document.getElementById('form-pub-status')?.value || 'draft',
      criteria,
      documents,
    };

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving scheme in MySQL transaction...';

      if (editSchemeId) {
        await api.put(`/api/admin/schemes/${editSchemeId}`, payload);
        showToast('Scheme updated successfully!', 'success');
      } else {
        await api.post('/api/admin/schemes', payload);
        showToast('Scheme created successfully with criteria and documents!', 'success');
      }

      setTimeout(() => {
        window.location.href = '/admin-schemes.html';
      }, 700);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = editSchemeId ? 'Update Scheme Record' : 'Create Government Scheme';
    }
  });
}

async function loadSchemeForEditing(schemeId) {
  try {
    const res = await api.get(`/api/admin/schemes/${schemeId}`);
    if (!res || !res.scheme) return;
    const s = res.scheme;

    if (document.getElementById('form-name')) document.getElementById('form-name').value = s.scheme_name || '';
    if (document.getElementById('form-category')) document.getElementById('form-category').value = s.category_id || '';
    if (document.getElementById('form-short-desc')) document.getElementById('form-short-desc').value = s.short_description || '';
    if (document.getElementById('form-desc')) document.getElementById('form-desc').value = s.description || '';
    if (document.getElementById('form-benefits')) document.getElementById('form-benefits').value = s.benefits || '';
    if (document.getElementById('form-start-date')) document.getElementById('form-start-date').value = s.start_date || '';
    if (document.getElementById('form-end-date')) document.getElementById('form-end-date').value = s.end_date || '';
    if (document.getElementById('form-scope')) document.getElementById('form-scope').value = s.applicable_scope || 'National';
    if (document.getElementById('form-state')) document.getElementById('form-state').value = s.applicable_state || '';
    if (document.getElementById('form-app-url')) document.getElementById('form-app-url').value = s.official_application_url || '';
    if (document.getElementById('form-source-url')) document.getElementById('form-source-url').value = s.official_source_url || '';
    if (document.getElementById('form-pub-status')) document.getElementById('form-pub-status').value = s.publication_status || 'draft';

    // Populate criteria rows
    const criteriaContainer = document.getElementById('criteria-dynamic-container');
    if (criteriaContainer && s.criteria) {
      criteriaContainer.innerHTML = '';
      if (s.criteria.length === 0) {
        addCriterionRow(criteriaContainer);
      } else {
        s.criteria.forEach((c) => addCriterionRow(criteriaContainer, c));
      }
    }

    // Populate document rows
    const docsContainer = document.getElementById('documents-dynamic-container');
    if (docsContainer && s.documents) {
      docsContainer.innerHTML = '';
      if (s.documents.length === 0) {
        addDocumentRow(docsContainer);
      } else {
        s.documents.forEach((d) => addDocumentRow(docsContainer, d));
      }
    }
  } catch (err) {
    showToast(`Failed to load scheme: ${err.message}`, 'error');
  }
}

function addCriterionRow(container, data = {}) {
  const row = document.createElement('div');
  row.className = 'dynamic-row dynamic-criterion-row';
  row.innerHTML = `
    <div style="flex: 2;">
      <select class="form-control crit-type">
        <option value="min_age" ${data.criterion_type === 'min_age' ? 'selected' : ''}>Minimum Age (>=)</option>
        <option value="max_age" ${data.criterion_type === 'max_age' ? 'selected' : ''}>Maximum Age (<=)</option>
        <option value="max_income" ${data.criterion_type === 'max_income' ? 'selected' : ''}>Maximum Annual Income (<=)</option>
        <option value="min_income" ${data.criterion_type === 'min_income' ? 'selected' : ''}>Minimum Annual Income (>=)</option>
        <option value="occupation" ${data.criterion_type === 'occupation' ? 'selected' : ''}>Target Occupation (=)</option>
        <option value="state" ${data.criterion_type === 'state' ? 'selected' : ''}>Applicable State (=)</option>
        <option value="education_level" ${data.criterion_type === 'education_level' ? 'selected' : ''}>Education Level (=)</option>
        <option value="beneficiary_group" ${data.criterion_type === 'beneficiary_group' ? 'selected' : ''}>Beneficiary Category (=)</option>
      </select>
    </div>
    <div style="flex: 1;">
      <select class="form-control crit-op">
        <option value=">=" ${data.operator === '>=' ? 'selected' : ''}>&gt;=</option>
        <option value="<=" ${data.operator === '<=' ? 'selected' : ''}>&lt;=</option>
        <option value="=" ${data.operator === '=' ? 'selected' : ''}>=</option>
        <option value=">" ${data.operator === '>' ? 'selected' : ''}>&gt;</option>
        <option value="<" ${data.operator === '<' ? 'selected' : ''}>&lt;</option>
      </select>
    </div>
    <div style="flex: 2;">
      <input type="text" class="form-control crit-val" placeholder="Value (e.g. 18, 250000, Farmer)" value="${escapeHtml(data.criterion_value || '')}">
    </div>
    <div style="flex: 3;">
      <input type="text" class="form-control crit-desc" placeholder="Human readable explanation" value="${escapeHtml(data.description || '')}">
    </div>
    <div style="display: flex; align-items: center; gap: 0.35rem; padding: 0 0.5rem;">
      <label style="font-size: 0.8rem; margin: 0; cursor: pointer;">
        <input type="checkbox" class="crit-mandatory" ${data.is_mandatory !== 0 ? 'checked' : ''}> Mandatory
      </label>
    </div>
    <div>
      <button type="button" class="btn btn-danger btn-sm btn-remove-row">✖</button>
    </div>
  `;

  row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

function addDocumentRow(container, data = {}) {
  const row = document.createElement('div');
  row.className = 'dynamic-row dynamic-document-row';
  row.innerHTML = `
    <div style="flex: 3;">
      <input type="text" class="form-control doc-name" placeholder="Document Name (e.g. Aadhaar Card, 7/12 Extract)" value="${escapeHtml(data.document_name || '')}">
    </div>
    <div style="flex: 4;">
      <input type="text" class="form-control doc-desc" placeholder="Verification note or issuing authority" value="${escapeHtml(data.description || '')}">
    </div>
    <div style="display: flex; align-items: center; gap: 0.35rem; padding: 0 0.5rem;">
      <label style="font-size: 0.8rem; margin: 0; cursor: pointer;">
        <input type="checkbox" class="doc-mandatory" ${data.is_mandatory !== 0 ? 'checked' : ''}> Mandatory
      </label>
    </div>
    <div>
      <button type="button" class="btn btn-danger btn-sm btn-remove-row">✖</button>
    </div>
  `;

  row.querySelector('.btn-remove-row').addEventListener('click', () => row.remove());
  container.appendChild(row);
}

// ============================================================================
// 4. ADMIN CATEGORIES
// ============================================================================
async function initAdminCategories() {
  const tbody = document.getElementById('admin-categories-tbody');
  const addForm = document.getElementById('form-add-category');

  if (addForm) {
    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('cat-name')?.value.trim();
      const desc = document.getElementById('cat-desc')?.value.trim();

      try {
        await api.post('/api/admin/categories', { category_name: name, description: desc });
        showToast('Category created successfully!', 'success');
        addForm.reset();
        loadCategoriesTable();
      } catch (err) {
        showToast(err.message, 'error');
      }
    });
  }

  loadCategoriesTable();
}

async function loadCategoriesTable() {
  const tbody = document.getElementById('admin-categories-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 2rem;">Loading categories...</td></tr>`;

  try {
    const res = await api.get('/api/categories');
    if (!res || !res.categories || res.categories.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center;">No categories configured.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.categories
      .map(
        (c) => `
      <tr>
        <td><strong>#${c.category_id}</strong></td>
        <td><strong>${escapeHtml(c.category_name)}</strong></td>
        <td>${escapeHtml(c.description || 'No description.')}</td>
        <td><span class="badge badge-scope">${c.total_schemes || 0} schemes</span></td>
        <td>
          <button class="btn btn-danger btn-sm btn-delete-cat" data-id="${c.category_id}" data-count="${c.total_schemes || 0}">Delete</button>
        </td>
      </tr>
    `
      )
      .join('');

    tbody.querySelectorAll('.btn-delete-cat').forEach((btn) => {
      btn.addEventListener('click', async (e) => {
        const id = e.target.getAttribute('data-id');
        const count = parseInt(e.target.getAttribute('data-count'), 10);

        if (count > 0) {
          alert(`Cannot delete category #${id}. It currently has ${count} scheme(s) linked to it. Reassign or delete those schemes first.`);
          return;
        }

        if (confirm(`Are you sure you want to delete category #${id}?`)) {
          try {
            await api.delete(`/api/admin/categories/${id}`);
            showToast('Category deleted successfully.', 'info');
            loadCategoriesTable();
          } catch (err) {
            showToast(err.message, 'error');
          }
        }
      });
    });
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="alert alert-error">${escapeHtml(err.message)}</td></tr>`;
  }
}

// ============================================================================
// 5. ADMIN AUDIT LOGS
// ============================================================================
async function initAdminAuditLogs() {
  const tbody = document.getElementById('admin-audit-tbody');
  const actionFilter = document.getElementById('audit-action-filter');

  if (actionFilter) {
    actionFilter.addEventListener('change', () => loadAuditLogs(actionFilter.value));
  }

  loadAuditLogs();
}

async function loadAuditLogs(actionType = '') {
  const tbody = document.getElementById('admin-audit-tbody');
  if (!tbody) return;

  tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center; padding: 2rem;">Loading audit trail...</td></tr>`;

  try {
    let url = '/api/admin/audit-logs?limit=50';
    if (actionType) url += `&actionType=${encodeURIComponent(actionType)}`;

    const res = await api.get(url);
    if (!res || !res.logs || res.logs.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" class="text-muted" style="text-align: center;">No audit logs found.</td></tr>`;
      return;
    }

    tbody.innerHTML = res.logs
      .map(
        (l) => `
      <tr>
        <td><strong>#${l.audit_id}</strong></td>
        <td>
          <strong>${escapeHtml(l.admin_name || 'System')}</strong>
          <div style="font-size: 0.78rem; color: var(--text-muted);">${escapeHtml(l.admin_email || '')}</div>
        </td>
        <td><span class="badge badge-scope">${escapeHtml(l.action_type)}</span></td>
        <td>${escapeHtml(l.description)}</td>
        <td>${formatDate(l.changed_at)}</td>
      </tr>
    `
      )
      .join('');
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="5" class="alert alert-error">${escapeHtml(err.message)}</td></tr>`;
  }
}
