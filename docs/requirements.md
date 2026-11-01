# System Requirements Specification
**Project:** Government Scheme Management and Eligibility Recommendation System  

---

## 1. Functional Requirements

### 1.1 Citizen & Public User Features
1. **Public Catalog Browsing:** Citizens and visitors can view all published schemes without requiring immediate account creation.
2. **Multi-Parameter Search & Filtering:**
   - Text search across scheme titles, descriptions, and benefits.
   - Filter by domain category (Agriculture, Education, Healthcare, Housing, etc.).
   - Filter by geographic scope (National vs. Specific State like Maharashtra, Gujarat).
   - Filter by occupation (Farmer, Student, Self-Employed, Unemployed Youth).
   - Filter by lifecycle status (Open, Upcoming, Closed).
   - Filter by age threshold and annual family income ceiling.
   - Sorting by Name (A-Z), Application Closing Date, and Recently Added.
3. **Comprehensive Scheme Details:**
   - Complete scheme description and quantified financial/welfare benefits.
   - Tabular eligibility criteria with operators and target values.
   - Checklist of required supporting documents (marked mandatory or optional).
   - Direct link to official government department application portals.
4. **Preliminary Eligibility Assessment:**
   - Input demographic attributes (age, state, occupation, income, education, beneficiary category).
   - Automated evaluation returning clear status (*Likely Eligible*, *Not Eligible*, *More Information Required*).
   - Detailed rule-by-rule breakdown showing exactly which criteria passed or failed.
5. **Citizen Account & Profile:**
   - Registration with email verification and bcrypt password hashing.
   - Maintain demographic profile to avoid re-entering details during eligibility checks.
   - Automated calculation of age from date of birth.
6. **Scheme Bookmarks (Saved Schemes):**
   - Save schemes to personalized bookmarks list.
   - Quick-access dashboard and one-click removal.

### 1.2 Administrative Features
1. **Secure Admin Authentication:**
   - Dedicated login interface restricted to authorized administrative emails.
   - Session regeneration and protection against brute-force attacks.
2. **Scheme Lifecycle Management (CRUD):**
   - Add new schemes with metadata, benefits, opening/closing dates, and official URLs.
   - Atomic creation and updating of scheme records alongside their associated criteria and documents within a single MySQL transaction.
   - Toggle publication status (`draft`, `published`, `unpublished`).
   - Safe deletion of schemes with automated audit logging and cascade handling.
3. **Category Domain Management:**
   - Create, edit, and delete categories with referential integrity checks (prevents deletion if schemes are linked).
4. **Administrative Audit Trail:**
   - View chronological history of all scheme additions, status changes, and deletions in `scheme_audit_log`.
5. **Database-Driven Dashboard Analytics:**
   - Live KPI cards: Total schemes, published schemes, open schemes, upcoming schemes, closed schemes, total users.
   - Chart.js visualizations: Schemes per category and status distribution.

---

## 2. Non-Functional Requirements

1. **Relational Data Integrity:** Enforce Primary Keys, Foreign Keys with explicit `ON DELETE CASCADE` or `ON DELETE SET NULL`, Unique constraints, and Check constraints (`annual_income >= 0`, `end_date >= start_date`).
2. **Security & Data Protection:**
   - Cryptographic password hashing using bcrypt with 10 salt rounds.
   - Parameterized SQL queries via `mysql2` to eliminate SQL injection risks.
   - Double-submit CSRF token validation on all mutating API requests.
   - HTTP security headers powered by Helmet.
   - XSS sanitization and HTML escaping before DOM insertion.
   - Strict avoidance of collecting sensitive citizen identifiers (no Aadhaar numbers or bank passwords).
3. **Performance & Scalability:**
   - Connection pooling with MySQL (`connectionLimit: 10`).
   - Covering indexes on foreign keys, categories, dates, and publication status.
4. **Usability & Accessibility:**
   - Modern civic-inspired UI/UX (Navy blue, clean white, saffron and emerald green accents).
   - Responsive Flexbox and Grid layouts optimized for mobile, tablet, and desktop screens.
   - Clear loading, empty, and error feedback states.

---

## 3. Hardware and Software Specifications

### Hardware Requirements (Development & Local Demonstration)
- **Processor:** Intel Core i3 / AMD Ryzen 3 or higher.
- **RAM:** Minimum 4 GB (8 GB recommended).
- **Storage:** Minimum 500 MB free hard disk space.

### Software Requirements
- **Operating System:** Windows 10 / Windows 11 / macOS / Linux.
- **Runtime:** Node.js (LTS version 18.x or 20.x recommended).
- **Package Manager:** npm (v9.x or higher).
- **Database Server:** MySQL Server 8.0+ or compatible MySQL 5.7+ / MariaDB 10.4+.
- **Web Browser:** Google Chrome, Mozilla Firefox, Microsoft Edge, or Safari.
- **Editor / IDE:** Visual Studio Code or Google Antigravity.
