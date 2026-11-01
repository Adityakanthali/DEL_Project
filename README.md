# Government Scheme Management and Eligibility Recommendation System
**A Full-Stack Database-Driven Web Application for College DBMS Mini-Project Demonstration**  
**Technology Stack:** Node.js (Express.js), MySQL 8.0 (InnoDB), Vanilla JavaScript (ES6 Modules), HTML5, CSS3  

---

## 🏛️ Project Overview
The **Government Scheme Management and Eligibility Recommendation System** is an educational, full-stack web application designed to help citizens discover, filter, and evaluate their eligibility for social welfare, scholarship, agricultural, and employment programs. Concurrently, an administrative dashboard enables government scheme officers to manage scheme catalogs, configure multi-parameter eligibility criteria, attach required supporting documents, and view audit history.

### Key Highlights
- **Relational Normalization:** Complete schema normalized up to **Third Normal Form (3NF)** with explicit foreign keys and check constraints.
- **Advanced MySQL Features:** Stored Procedures, Stored Functions, Cursor Loops, and Triggers written in valid MySQL syntax.
- **Explainable Eligibility Engine:** Allowlist-driven rule matching providing criterion-by-criterion explanation (*Likely Eligible*, *Not Eligible*, or *More Information Required*).
- **Enterprise Security:** Bcrypt password hashing, session regeneration, CSRF protection, and parameterized SQL queries (`mysql2/promise`).

---

## 📁 Project Folder Structure

```
government-scheme-system/
├── package.json                   # Dependencies, scripts (start, dev, seed, test)
├── server.js                      # Application server bootstrapper
├── .env.example                   # Safe environment template
├── .env                           # Local environment configuration
├── README.md                      # Complete setup, execution, and viva guide
│
├── src/
│   ├── app.js                     # Express setup, security middleware, static routing
│   ├── config/
│   │   ├── db.js                  # MySQL connection pool (mysql2/promise)
│   │   └── env.js                 # Environment variables loader
│   ├── routes/
│   │   ├── authRoutes.js          # Authentication & CSRF token endpoints
│   │   ├── schemeRoutes.js        # Public scheme discovery & details
│   │   ├── categoryRoutes.js      # Scheme domain categories
│   │   ├── eligibilityRoutes.js   # Single-scheme and multi-scheme evaluation
│   │   ├── userRoutes.js          # Citizen profile & saved schemes (bookmarks)
│   │   └── adminRoutes.js         # Protected admin CRUD & audit logs
│   ├── controllers/
│   │   ├── authController.js      # Session login/register/logout handlers
│   │   ├── schemeController.js    # Scheme catalog & details logic
│   │   ├── categoryController.js  # Category endpoints
│   │   ├── eligibilityController.js # Rule matching controller
│   │   ├── userController.js      # Citizen profile & saved schemes logic
│   │   └── adminController.js     # Admin operations & analytics
│   ├── services/
│   │   ├── schemeService.js       # Atomic multi-table transactions (CRUD)
│   │   ├── eligibilityService.js  # Recommendation engine service
│   │   └── categoryService.js     # Category constraints & safety checks
│   ├── models/
│   │   ├── userModel.js           # Citizen users DAO
│   │   ├── adminModel.js          # Administrators DAO
│   │   ├── schemeModel.js         # Schemes queries, filters, and stats DAO
│   │   ├── categoryModel.js       # Categories DAO
│   │   ├── eligibilityModel.js    # Criteria rules DAO
│   │   ├── documentModel.js       # Required documents DAO
│   │   ├── savedSchemeModel.js    # Bookmarks junction table DAO
│   │   └── auditModel.js          # Administrative audit trail DAO
│   ├── middleware/
│   │   ├── authMiddleware.js      # Citizen session check
│   │   ├── adminMiddleware.js     # Admin role authorization guard
│   │   ├── csrfMiddleware.js      # Double-submit CSRF verification
│   │   ├── validateMiddleware.js  # Request validation helpers
│   │   └── errorMiddleware.js     # Centralized error handler
│   ├── utils/
│   │   ├── eligibilityEngine.js   # Pure rule matching algorithm
│   │   └── dateUtils.js           # Timeline and age calculations
│   └── scripts/
│       └── seedDatabase.js        # Automated MySQL database seeder
│
├── public/
│   ├── index.html                 # Public landing page with live MySQL stats
│   ├── schemes.html               # Scheme catalog with multi-parameter filters
│   ├── scheme.html                # Scheme details & embedded eligibility checker
│   ├── login.html                 # Citizen login
│   ├── register.html              # Citizen registration
│   ├── user-dashboard.html        # Citizen dashboard
│   ├── profile.html               # Demographic profile management
│   ├── saved-schemes.html         # Bookmarked schemes
│   ├── eligibility.html           # Multi-scheme recommendation wizard
│   ├── admin-login.html           # Dedicated administrator login
│   ├── admin-dashboard.html       # Admin dashboard with Chart.js analytics
│   ├── admin-schemes.html         # Admin scheme table with publish/unpublish
│   ├── admin-scheme-form.html     # Dynamic criteria & documents scheme editor
│   ├── admin-categories.html      # Category domain management
│   ├── admin-criteria.html        # Criteria management overview
│   ├── admin-documents.html       # Documents management overview
│   ├── admin-audit-logs.html      # Full administrative audit trail
│   └── assets/
│       ├── css/
│       │   ├── style.css          # Design system (Navy, Saffron, Emerald)
│       │   ├── admin.css          # Admin console styles & layout
│       │   └── responsive.css     # Mobile & tablet responsiveness
│       └── js/
│           ├── api.js             # Unified Fetch API client with CSRF injection
│           ├── main.js            # Navbar session sync, toasts, helpers
│           ├── auth.js            # Login, registration, profile forms
│           ├── schemes.js         # Catalog filtering, search, pagination
│           ├── eligibility.js     # Recommendation wizard UI
│           └── admin.js           # Charts, scheme CRUD, dynamic rows, audit
│
├── database/                      # Complete Sequential MySQL Scripts
│   ├── 01_create_database.sql     # Database creation & utf8mb4 charset
│   ├── 02_create_tables.sql       # 8 Relational tables with PKs & FKs
│   ├── 03_constraints_indexes.sql # Check constraints & covering indexes
│   ├── 04_sample_data.sql         # 8 categories, 15 schemes, criteria, docs
│   ├── 05_views.sql               # Dynamic views (v_published_schemes)
│   ├── 06_procedures_functions.sql# Stored procedures & stored functions
│   ├── 07_cursor_demo.sql         # SQL cursor iteration demonstration
│   ├── 08_triggers.sql            # BEFORE/AFTER INSERT, UPDATE, DELETE triggers
│   └── 09_demo_queries.sql        # 21 Required demo queries with joins/subqueries
│
├── docs/                          # Academic Report Documentation
│   ├── project-overview.md        # Abstract, problem statement, objectives
│   ├── requirements.md            # Functional & non-functional requirements
│   ├── architecture.md            # Layered architecture & REST API docs
│   ├── er-diagram.md              # Editable Mermaid ER diagram
│   ├── database-design.md         # Advanced DBMS concepts & routines
│   ├── normalization-3nf.md       # UNF to 3NF academic report with FDs
│   ├── data-dictionary.md         # Full column-by-column specification
│   ├── testing.md                 # Test methodology & test outcomes
│   └── viva-questions.md          # 30+ Viva voce questions and answers
│
└── tests/
    ├── eligibility.test.js        # Rule engine unit test suite
    ├── api-tests.js               # Date math and validation unit tests
    ├── run-tests.js               # Node.js automated test runner
    ├── verify_suite.py            # Python verification runner
    └── test-cases.md              # Test matrix & execution checklist
```

---

## 🚀 Windows 10/11 Step-by-Step Setup Guide

Follow these steps to run the application locally on Windows:

### Step 1: Install Node.js
If Node.js is not yet installed:
1. Download the LTS version from [https://nodejs.org](https://nodejs.org).
2. Run the installer and verify installation in Command Prompt or PowerShell:
   ```powershell
   node -v
   npm -v
   ```

### Step 2: Start MySQL Server
Ensure MySQL Server (version 8.0 or 5.7) or XAMPP MySQL is running:
- If using MySQL Server: Start the service via Windows Services (`services.msc`) or MySQL Command Line Client.
- If using XAMPP: Open XAMPP Control Panel and start the **MySQL** service.

### Step 3: Install Node.js Dependencies
In the project root folder (`c:\Users\Aditya\Documents\DEL_Project`), open terminal and run:
```powershell
npm install
```

### Step 4: Configure Database Settings
Check the `.env` file in the root directory. If your MySQL root user has a password, update `DB_PASSWORD`:
```ini
PORT=3000
NODE_ENV=development
SESSION_SECRET=gov_scheme_session_secret_key_change_in_production_2026_xyz

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password_here
DB_NAME=government_scheme_db
```

### Step 5: Import Database Scripts into MySQL
You can initialize the database using either **Method A (Automated)** or **Method B (Manual)**:

#### Method A: Automated Seeder (Recommended)
Run the built-in database setup script:
```powershell
npm run seed
```
This automatically creates `government_scheme_db`, applies all 8 tables, constraints, views, stored procedures, functions, triggers, and seeds realistic demo data with bcrypt hashes.

#### Method B: Manual Import (MySQL Workbench or CLI)
Execute the SQL scripts in `database/` in sequential order:
```sql
SOURCE database/01_create_database.sql;
SOURCE database/02_create_tables.sql;
SOURCE database/03_constraints_indexes.sql;
SOURCE database/04_sample_data.sql;
SOURCE database/05_views.sql;
SOURCE database/06_procedures_functions.sql;
SOURCE database/07_cursor_demo.sql;
SOURCE database/08_triggers.sql;
SOURCE database/09_demo_queries.sql;
```

### Step 6: Start the Express Application
Start the server:
```powershell
npm start
```
*(Or use `npm run dev` for auto-reloading during development).*

Console output will display:
```
======================================================================
 GOVERNMENT SCHEME MANAGEMENT AND ELIGIBILITY RECOMMENDATION SYSTEM 
 College DBMS Mini-Project | Full-Stack Express & MySQL Architecture 
======================================================================
Checking connection to MySQL database "government_scheme_db"...
✅ MySQL Database connected successfully via connection pool.
🚀 Server running on:
   👉 Citizen Portal:   http://localhost:3000
   👉 Admin Login:      http://localhost:3000/admin-login.html
   👉 Admin Dashboard:  http://localhost:3000/admin-dashboard.html
----------------------------------------------------------------------
Default Demo Accounts:
   Admin:   admin@govscheme.in       | Password: Admin@123
   Citizen: rahul.sharma@example.com | Password: Citizen@123
======================================================================
```

---

## 🌐 How to Access and Test the Portals

### 1. Citizen Portal
Open your browser to: **`http://localhost:3000`**
1. **Browse Schemes (`/schemes.html`):** Test live keyword searching (e.g., search *"Kisan"* or *"Scholarship"*), filter by Category, State, Occupation, and Status.
2. **View Scheme Details (`/scheme.html?id=1`):** Inspect benefits, criteria list, required documents, and the embedded **Eligibility Checker**.
3. **Register / Login:**
   - Sign in with pre-seeded demo citizen:
     - **Email:** `rahul.sharma@example.com`
     - **Password:** `Citizen@123`
4. **Citizen Dashboard (`/user-dashboard.html`):** View saved schemes, demographic profile, and recommendation shortcuts.
5. **Eligibility Wizard (`/eligibility.html`):** Enter age, income, and occupation to evaluate eligibility across all open schemes simultaneously.
6. **Save Scheme (Bookmark):** Click "Bookmark Scheme" on any scheme details page and inspect it on `/saved-schemes.html`.

### 2. Administrator Console
Open: **`http://localhost:3000/admin-login.html`**
- **Admin Email:** `admin@govscheme.in`
- **Password:** `Admin@123`
- **Features to Demonstrate:**
  1. **Dashboard Analytics (`/admin-dashboard.html`):** Live database KPI counters and Chart.js visualizations.
  2. **Scheme Management (`/admin-schemes.html`):** View all schemes, search, filter, and click **Publish / Unpublish** toggle.
  3. **Add Scheme (`/admin-scheme-form.html`):** Add a scheme with dynamic multi-row criteria and documents. Click save to demonstrate atomic MySQL transaction.
  4. **Delete Scheme:** Delete a demo scheme and verify that audit history is preserved in `/admin-audit-logs.html`.
  5. **Category Management (`/admin-categories.html`):** Add a new category and demonstrate referential integrity (cannot delete categories containing active schemes).

---

## 🎓 Demonstrating DBMS Concepts for College Viva

During your practical examination or viva, open **MySQL Workbench** or **MySQL CLI** and demonstrate:

1. **Relational Schema & 3NF (Script `02_create_tables.sql`):**
   ```sql
   USE government_scheme_db;
   SHOW TABLES;
   DESCRIBE schemes;
   DESCRIBE eligibility_criteria;
   ```
2. **Dynamic View (`v_published_schemes` in `05_views.sql`):**
   ```sql
   SELECT scheme_name, category_name, application_status, days_remaining
   FROM v_published_schemes;
   ```
3. **Stored Function (`06_procedures_functions.sql`):**
   ```sql
   SELECT scheme_name, fn_calculate_scheme_status(publication_status, start_date, end_date) AS dynamic_status
   FROM schemes;
   ```
4. **Stored Procedure with Transactions (`sp_add_scheme`):**
   ```sql
   CALL sp_add_scheme(
     'Demo Solar Subsidy', 'Roof solar incentive', 'Full description', '40% grant',
     1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 90 DAY), 'National', NULL,
     'https://example.gov.in', 'https://example.gov.in/gazette', 'published', 1,
     @new_id, @code, @msg
   );
   SELECT @new_id, @code, @msg;
   ```
5. **Cursor Iteration Demonstration (`07_cursor_demo.sql`):**
   ```sql
   CALL sp_generate_scheme_status_report();
   ```
   *Demonstrates cursor declaration, opening, fetch loop, not found handler, and closing.*
6. **Trigger Demonstration (`08_triggers.sql`):**
   ```sql
   -- Verify date integrity trigger rejects closing date earlier than opening date
   INSERT INTO schemes (scheme_name, short_description, description, benefits, category_id, start_date, end_date)
   VALUES ('Invalid Scheme', 'Desc', 'Desc', 'Benefit', 1, '2026-12-31', '2026-01-01');
   -- Result: Aborts with Error 45000: Scheme closing date cannot precede opening date.
   ```
7. **21 Required Complex Queries (`09_demo_queries.sql`):**
   Execute any of the 21 queries to demonstrate Joins, Subqueries, Aggregate functions, and HAVING clauses.

---

## 🧪 Running Automated Unit Tests
To run the automated verification checks:
```powershell
python tests/verify_suite.py
```
*(Or `npm test` once Node.js is installed).*

---

## 🔧 Troubleshooting Common Errors

1. **`ECONNREFUSED 127.0.0.1:3306`:**
   - MySQL service is not running. Start MySQL from Windows Services or XAMPP.
2. **`ER_ACCESS_DENIED_ERROR` for user 'root'@'localhost':**
   - Check the `DB_PASSWORD` setting in `.env`. If your root user has a password (e.g. `root` or `admin`), update the `.env` file accordingly.
3. **`ER_BAD_DB_ERROR: Unknown database 'government_scheme_db'`:**
   - Run `npm run seed` or execute `database/01_create_database.sql` to initialize the database.
4. **Port 3000 already in use:**
   - Change `PORT=3001` in `.env`.
