/**
 * Standalone Eligibility Recommendation Engine Script
 * Powers /eligibility.html wizard evaluating multiple schemes simultaneously.
 */

import { api } from './api.js';
import { showToast, escapeHtml } from './main.js';

document.addEventListener('DOMContentLoaded', () => {
  const wizardForm = document.getElementById('eligibility-wizard-form');
  const resultsArea = document.getElementById('wizard-results-area');

  if (!wizardForm) return;

  // Auto-fill from profile if logged in
  api.get('/api/user/profile')
    .then((res) => {
      if (res && res.profile) {
        const p = res.profile;
        if (p.age && document.getElementById('wiz-age')) document.getElementById('wiz-age').value = p.age;
        if (p.state && document.getElementById('wiz-state')) document.getElementById('wiz-state').value = p.state;
        if (p.occupation && document.getElementById('wiz-occupation')) document.getElementById('wiz-occupation').value = p.occupation;
        if (p.annual_income && document.getElementById('wiz-income')) document.getElementById('wiz-income').value = p.annual_income;
        if (p.education_level && document.getElementById('wiz-education')) document.getElementById('wiz-education').value = p.education_level;
        if (p.beneficiary_group && document.getElementById('wiz-beneficiary')) document.getElementById('wiz-beneficiary').value = p.beneficiary_group;
      }
    })
    .catch(() => {});

  wizardForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = wizardForm.querySelector('button[type="submit"]');

    const profile = {
      age: document.getElementById('wiz-age')?.value || null,
      state: document.getElementById('wiz-state')?.value || null,
      occupation: document.getElementById('wiz-occupation')?.value || null,
      annual_income: document.getElementById('wiz-income')?.value || null,
      education_level: document.getElementById('wiz-education')?.value || null,
      beneficiary_group: document.getElementById('wiz-beneficiary')?.value || null,
    };

    try {
      btn.disabled = true;
      btn.textContent = 'Evaluating all open schemes in MySQL...';
      resultsArea.style.display = 'block';
      resultsArea.innerHTML = `<div style="text-align: center; padding: 2rem;"><p class="text-muted">Analyzing eligibility rules across database records...</p></div>`;

      const res = await api.post('/api/eligibility/recommendations', { profile });

      renderWizardRecommendations(resultsArea, res.recommendations || []);
    } catch (err) {
      showToast(err.message, 'error');
      resultsArea.innerHTML = `<div class="alert alert-error">${escapeHtml(err.message)}</div>`;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Run Recommendation Engine';
    }
  });
});

function renderWizardRecommendations(container, recs) {
  if (!recs || recs.length === 0) {
    container.innerHTML = `
      <div class="alert alert-info">
        No active schemes found in the database for evaluation.
      </div>
    `;
    return;
  }

  const likely = recs.filter((r) => r.eligibilityStatus === 'Likely Eligible');
  const moreInfo = recs.filter((r) => r.eligibilityStatus === 'More Information Required');
  const notEligible = recs.filter((r) => r.eligibilityStatus === 'Not Eligible');

  container.innerHTML = `
    <div style="margin-bottom: 2rem;">
      <h2 style="font-size: 1.5rem; color: var(--primary); margin-bottom: 0.5rem;">Recommendation Results</h2>
      <p class="text-muted">Evaluated ${recs.length} schemes against your profile attributes.</p>
      
      <div style="display: flex; gap: 1rem; margin-top: 1rem; flex-wrap: wrap;">
        <span class="badge badge-open" style="font-size: 0.9rem; padding: 0.4rem 0.85rem;">✅ ${likely.length} Likely Eligible</span>
        <span class="badge badge-upcoming" style="font-size: 0.9rem; padding: 0.4rem 0.85rem;">ℹ️ ${moreInfo.length} Needs More Info</span>
        <span class="badge badge-closed" style="font-size: 0.9rem; padding: 0.4rem 0.85rem;">❌ ${notEligible.length} Ineligible</span>
      </div>
    </div>

    <!-- Likely Eligible Section -->
    ${
      likely.length > 0
        ? `
      <div style="margin-bottom: 2.5rem;">
        <h3 style="color: var(--accent-green); margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>✅ High Match: Schemes You May Be Eligible For</span>
        </h3>
        <div class="schemes-grid">
          ${likely.map((s) => renderRecommendationCard(s, 'likely')).join('')}
        </div>
      </div>
    `
        : ''
    }

    <!-- More Info Section -->
    ${
      moreInfo.length > 0
        ? `
      <div style="margin-bottom: 2.5rem;">
        <h3 style="color: #b45309; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>ℹ️ Missing Profile Details Required</span>
        </h3>
        <div class="schemes-grid">
          ${moreInfo.map((s) => renderRecommendationCard(s, 'more-info')).join('')}
        </div>
      </div>
    `
        : ''
    }

    <!-- Ineligible Section -->
    ${
      notEligible.length > 0
        ? `
      <div style="margin-bottom: 2rem;">
        <h3 style="color: #64748b; margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;">
          <span>❌ Schemes Where Criteria Were Not Satisfied</span>
        </h3>
        <div class="schemes-grid">
          ${notEligible.map((s) => renderRecommendationCard(s, 'not-eligible')).join('')}
        </div>
      </div>
    `
        : ''
    }

    <div style="background: #f1f5f9; padding: 1.25rem; border-radius: 8px; font-size: 0.82rem; color: #475569; margin-top: 2rem;">
      <strong>Educational Project Disclaimer:</strong> This eligibility scoring is based on automated algorithm evaluation of sample rules. Please check official gazettes and portals before applying.
    </div>
  `;
}

function renderRecommendationCard(s, typeClass) {
  let badge = `<span class="badge badge-open">Likely Eligible</span>`;
  if (typeClass === 'more-info') badge = `<span class="badge badge-upcoming">More Info Needed</span>`;
  if (typeClass === 'not-eligible') badge = `<span class="badge badge-closed">Not Eligible</span>`;

  return `
    <div class="scheme-card" style="border-top: 4px solid ${typeClass === 'likely' ? 'var(--accent-green)' : typeClass === 'more-info' ? '#f59e0b' : '#94a3b8'};">
      <div class="scheme-card-header">
        <span class="scheme-category-badge">${escapeHtml(s.category_name)}</span>
        ${badge}
      </div>
      <h3 class="scheme-title">${escapeHtml(s.scheme_name)}</h3>
      <p class="scheme-desc">${escapeHtml(s.short_description)}</p>
      
      <div style="background: #f8fafc; padding: 0.65rem 0.85rem; border-radius: 6px; font-size: 0.85rem; margin-bottom: 1rem;">
        <strong>Evaluation Note:</strong> ${escapeHtml(s.eligibilityMessage)}
      </div>

      <div class="scheme-card-footer">
        <a href="/scheme.html?id=${s.scheme_id}" class="btn btn-primary btn-sm">View Full Scheme Details →</a>
      </div>
    </div>
  `;
}
