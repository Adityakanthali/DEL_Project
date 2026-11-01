# Database Data Dictionary
**Database:** `government_scheme_db`  
**Engine:** MySQL InnoDB  
**Charset / Collation:** `utf8mb4` / `utf8mb4_unicode_ci`  

---

## 1. Table: `admins`
Stores authenticated administrative personnel credentials and privileges.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `admin_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique surrogate identifier for administrators |
| `full_name` | VARCHAR(100) | NO | NOT NULL | - | Full legal name of administrator |
| `email` | VARCHAR(150) | NO | UNIQUE, Index | - | Unique email address for admin login |
| `password_hash` | VARCHAR(255) | NO | NOT NULL | - | Cryptographic bcrypt password hash |
| `role` | VARCHAR(50) | NO | NOT NULL | `'admin'` | Administrative role (`superadmin`, `admin`, `officer`) |
| `is_active` | BOOLEAN | NO | NOT NULL | `TRUE` | Account active status flag |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Account creation timestamp |
| `updated_at` | TIMESTAMP | NO | - | ON UPDATE `CURRENT_TIMESTAMP` | Last profile update timestamp |

---

## 2. Table: `users`
Stores registered citizen profiles used for scheme bookmarking and automated eligibility matching.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique surrogate identifier for citizens |
| `full_name` | VARCHAR(100) | NO | NOT NULL | - | Full name of citizen |
| `email` | VARCHAR(150) | NO | UNIQUE, Index | - | Unique login email |
| `password_hash` | VARCHAR(255) | NO | NOT NULL | - | Bcrypt hashed password |
| `date_of_birth` | DATE | YES | - | NULL | Date of birth (age dynamically derived) |
| `state` | VARCHAR(100) | YES | - | NULL | State of permanent residence |
| `district` | VARCHAR(100) | YES | - | NULL | District or city of residence |
| `occupation` | VARCHAR(100) | YES | - | NULL | Primary occupation (Farmer, Student, etc.) |
| `annual_income` | DECIMAL(12,2) | YES | CHECK (>= 0) | NULL | Annual family household income in INR |
| `education_level` | VARCHAR(100) | YES | - | NULL | Highest education qualification |
| `beneficiary_group` | VARCHAR(100) | YES | - | NULL | Affirmative action or social category (General, SC, ST, OBC) |
| `is_active` | BOOLEAN | NO | NOT NULL | `TRUE` | Account status flag |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Account registration timestamp |
| `updated_at` | TIMESTAMP | NO | - | ON UPDATE `CURRENT_TIMESTAMP` | Last profile update timestamp |

---

## 3. Table: `categories`
Lookup table defining government scheme sectors and domains.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `category_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique category identifier |
| `category_name` | VARCHAR(100) | NO | UNIQUE, Index | - | Sector name (e.g. Agriculture, Healthcare) |
| `description` | TEXT | YES | - | NULL | Explanatory scope of schemes in this domain |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Category creation timestamp |

---

## 4. Table: `schemes`
Central relation storing government welfare scheme metadata and dates.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `scheme_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique scheme identifier |
| `scheme_name` | VARCHAR(200) | NO | NOT NULL | - | Official title of the government scheme |
| `short_description` | VARCHAR(500) | NO | NOT NULL | - | Brief 1-2 sentence excerpt for catalog cards |
| `description` | TEXT | NO | NOT NULL | - | Comprehensive scheme description |
| `benefits` | TEXT | NO | NOT NULL | - | Detailed financial and welfare benefits |
| `category_id` | INT | NO | FK $\rightarrow$ `categories` | - | Domain category foreign key (`ON DELETE RESTRICT`) |
| `start_date` | DATE | NO | NOT NULL | - | Application opening date |
| `end_date` | DATE | YES | CHECK (>= start_date) | NULL | Closing date (NULL for ongoing programs) |
| `applicable_scope` | VARCHAR(50) | NO | CHECK (IN Scope) | `'National'` | Scope: `National`, `State`, or `Regional` |
| `applicable_state` | VARCHAR(100) | YES | - | NULL | Specific state name if scope is `State` |
| `official_application_url` | VARCHAR(500) | YES | - | NULL | External official portal application link |
| `official_source_url` | VARCHAR(500) | YES | - | NULL | Official gazette or ministerial notification link |
| `source_last_verified_at` | DATE | YES | - | NULL | Date on which rules were last verified |
| `publication_status` | ENUM | NO | `'draft', 'published', 'unpublished'` | `'draft'` | Publication lifecycle status |
| `created_by_admin_id` | INT | YES | FK $\rightarrow$ `admins` | NULL | Admin author (`ON DELETE SET NULL`) |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Record onboarding timestamp |
| `updated_at` | TIMESTAMP | NO | - | ON UPDATE `CURRENT_TIMESTAMP` | Record modification timestamp |

---

## 5. Table: `eligibility_criteria`
Stores atomic eligibility conditions associated with schemes.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `criterion_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique criterion identifier |
| `scheme_id` | INT | NO | FK $\rightarrow$ `schemes` | - | Scheme link (`ON DELETE CASCADE`) |
| `criterion_type` | VARCHAR(50) | NO | NOT NULL | - | Type: `min_age`, `max_income`, `occupation`, `state`, etc. |
| `operator` | VARCHAR(10) | NO | CHECK (`>=, <=, =, >, <`) | - | Comparison operator allowlist |
| `criterion_value` | VARCHAR(100) | NO | NOT NULL | - | Target threshold value (e.g. `18`, `250000`, `Farmer`) |
| `is_mandatory` | BOOLEAN | NO | NOT NULL | `TRUE` | Whether satisfying this rule is mandatory |
| `description` | VARCHAR(255) | NO | NOT NULL | - | Plain-language description for citizens |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Timestamp created |
| `updated_at` | TIMESTAMP | NO | - | ON UPDATE `CURRENT_TIMESTAMP` | Timestamp updated |

---

## 6. Table: `required_documents`
Lists supporting documentation required for application.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `document_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique document requirement identifier |
| `scheme_id` | INT | NO | FK $\rightarrow$ `schemes` | - | Scheme link (`ON DELETE CASCADE`) |
| `document_name` | VARCHAR(150) | NO | NOT NULL | - | Name of document (e.g. `Aadhaar Card`, `Land 7/12 Extract`) |
| `description` | VARCHAR(255) | YES | - | NULL | Issuing authority or instructions |
| `is_mandatory` | BOOLEAN | NO | NOT NULL | `TRUE` | Mandatory vs optional proof |
| `created_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Record creation timestamp |

---

## 7. Table: `user_saved_schemes`
Junction table implementing many-to-many bookmarks between citizens and schemes.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `user_id` | INT | NO | PK (Composite), FK $\rightarrow$ `users` | - | Citizen ID (`ON DELETE CASCADE`) |
| `scheme_id` | INT | NO | PK (Composite), FK $\rightarrow$ `schemes` | - | Scheme ID (`ON DELETE CASCADE`) |
| `saved_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Timestamp when user saved the scheme |

---

## 8. Table: `scheme_audit_log`
Chronological audit trail recording all administrative alterations.

| Column Name | Data Type | Nullable | Key / Constraint | Default | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `audit_id` | INT | NO | Primary Key | AUTO_INCREMENT | Unique audit log entry ID |
| `admin_id` | INT | YES | FK $\rightarrow$ `admins` | NULL | Admin who executed action (`ON DELETE SET NULL`) |
| `scheme_id` | INT | YES | FK $\rightarrow$ `schemes` | NULL | Target scheme (`ON DELETE SET NULL` preserves history) |
| `action_type` | VARCHAR(50) | NO | NOT NULL | - | e.g. `SCHEME_CREATED`, `SCHEME_UPDATED`, `SCHEME_DELETED` |
| `description` | TEXT | NO | NOT NULL | - | Detailed narrative of the modification |
| `changed_at` | TIMESTAMP | NO | - | `CURRENT_TIMESTAMP` | Timestamp of administrative action |
