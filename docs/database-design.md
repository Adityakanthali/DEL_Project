# Database Design & Advanced DBMS Concepts
**Project:** Government Scheme Management and Eligibility Recommendation System  
**DBMS:** MySQL 8.0+ / 5.7 Compatible (InnoDB Storage Engine)  

---

## 1. Relational Database Concepts Implemented

The database `government_scheme_db` satisfies all academic requirements for a comprehensive college DBMS mini-project:

### 1.1 Integrity Constraints
- **Entity Integrity (Primary Keys):** Every table features an explicit primary key (`admin_id`, `user_id`, `category_id`, `scheme_id`, `criterion_id`, `document_id`, `audit_id`). Junction table `user_saved_schemes` uses a composite primary key `(user_id, scheme_id)` ensuring uniqueness of bookmarks without duplicate records.
- **Referential Integrity (Foreign Keys):** Explicit relationships connect entities with deliberate cascade strategies:
  - `schemes.category_id` $\rightarrow$ `categories(category_id)` (`ON DELETE RESTRICT` protects against deleting active categories).
  - `eligibility_criteria.scheme_id` $\rightarrow$ `schemes(scheme_id)` (`ON DELETE CASCADE` removes dependent rules when a scheme is deleted).
  - `required_documents.scheme_id` $\rightarrow$ `schemes(scheme_id)` (`ON DELETE CASCADE`).
  - `scheme_audit_log.scheme_id` $\rightarrow$ `schemes(scheme_id)` (`ON DELETE SET NULL` preserves historical audit trails when a scheme is removed).
- **Domain Constraints (Check Constraints):**
  - `chk_user_income`: `annual_income IS NULL OR annual_income >= 0` (prevents negative income numbers).
  - `chk_scheme_dates`: `end_date IS NULL OR end_date >= start_date` (guarantees closing dates never precede opening dates).
  - `chk_criteria_operator`: `operator IN ('>=', '<=', '=', '>', '<')` (restricts comparison operators to a secure allowlist).
  - `chk_scheme_scope`: `applicable_scope IN ('National', 'State', 'Regional')`.
- **Unique Constraints:** `users.email` and `admins.email` enforce unique accounts. `categories.category_name` ensures no duplicate domain titles.

---

## 2. Advanced MySQL Routines & Features

### 2.1 Stored Functions
Stored functions execute inside expressions and return a single scalar value.
1. **`fn_calculate_scheme_status(p_pub_status, p_start_date, p_end_date)`:**
   - **Purpose:** Dynamically computes whether a scheme is *Draft*, *Unpublished*, *Upcoming*, *Open*, or *Closed* relative to `CURDATE()`.
   - **Academic Value:** Demonstrates avoiding redundant status storage that could diverge from calendar dates.
2. **`fn_calculate_user_age(p_dob)`:**
   - **Purpose:** Computes completed years using `TIMESTAMPDIFF(YEAR, p_dob, CURDATE())`.
   - **Academic Value:** Avoids stale age columns by computing age dynamically from date of birth.

### 2.2 Stored Procedures
1. **`sp_add_scheme(...)`:**
   - **Purpose:** Atomically creates a scheme, executes validation checks, writes to the audit log, and returns generated IDs.
   - **Concepts Demonstrated:**
     - Explicit transaction control (`START TRANSACTION`, `COMMIT`, `ROLLBACK`).
     - Exception handling (`DECLARE EXIT HANDLER FOR SQLEXCEPTION`).
     - Output parameters (`OUT p_new_scheme_id INT`, `OUT p_status_code INT`).
2. **`sp_get_open_schemes(IN p_category_id INT, IN p_state VARCHAR(100))`:**
   - **Purpose:** Returns currently open schemes filtered by domain and state.
3. **`sp_get_scheme_details(IN p_scheme_id INT)`:**
   - **Purpose:** Joins categories, creator admin, and subquery counts of criteria and documents.
4. **`sp_get_category_summary()`:**
   - **Purpose:** Returns domain metrics from `v_scheme_category_summary`.

### 2.3 SQL Cursor Demonstration
Implemented in `07_cursor_demo.sql` via procedure `sp_generate_scheme_status_report()`:
- **Cursor Declaration:** `DECLARE cur_schemes CURSOR FOR SELECT ... FROM schemes;`
- **NOT FOUND Handler:** `DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;`
- **Cursor Lifecycle:**
  1. `OPEN cur_schemes;`
  2. `fetch_loop: LOOP FETCH cur_schemes INTO ...; IF v_done = 1 THEN LEAVE fetch_loop; END IF; ... END LOOP;`
  3. `CLOSE cur_schemes;`
- **Observable Result:** Inserts evaluated metrics into a temporary table `temp_scheme_report` and outputs a formatted summary table displaying scheme names, calculated statuses, days remaining, and criteria counts.

### 2.4 Triggers
Implemented in `08_triggers.sql`:
1. **`trg_before_scheme_insert` (BEFORE INSERT):** Validates that `NEW.end_date >= NEW.start_date`. Aborts transaction using `SIGNAL SQLSTATE '45000'` if violated.
2. **`trg_before_scheme_update` (BEFORE UPDATE):** Validates date range during scheme updates.
3. **`trg_after_scheme_insert` (AFTER INSERT):** Automatically creates an initial creation record in `scheme_audit_log`.
4. **`trg_after_scheme_update` (AFTER UPDATE):** Compares `OLD` and `NEW` publication statuses, logging status transitions automatically.
5. **`trg_before_scheme_delete` (BEFORE DELETE):** Preserves scheme ID, title, and creator admin in `scheme_audit_log` before physical deletion.

### 2.5 SQL Views
Implemented in `05_views.sql`:
1. **`v_published_schemes`:** Virtual table encapsulating published schemes, joined with categories, and computing `application_status` and `days_remaining`.
2. **`v_scheme_category_summary`:** Virtual table aggregating `total_schemes`, `open_schemes`, `upcoming_schemes`, and `closed_schemes` per category.
3. **`v_user_saved_schemes_detail`:** Multi-table view joining bookmarks, users, schemes, and categories.
