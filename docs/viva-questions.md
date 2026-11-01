# College DBMS Mini-Project Viva Voce Guide
**Project:** Government Scheme Management and Eligibility Recommendation System  
**Audience:** Computer Engineering Student Preparing for Project Presentation & Viva  

---

## 1. Relational Database & SQL Questions

### Q1. What is Normalization and up to what normal form is your project normalized?
**Answer:** Normalization is the formal process of structuring a relational database schema to eliminate data redundancy and avoid insertion, update, and deletion anomalies. This project is normalized up to **Third Normal Form (3NF)**:
- **1NF:** All attributes contain atomic values (e.g. eligibility criteria and required documents are broken out into separate rows rather than comma-separated strings).
- **2NF:** The database is in 1NF and contains no partial functional dependencies. In junction table `user_saved_schemes` with composite primary key `(user_id, scheme_id)`, the non-key attribute `saved_at` depends on the full composite key.
- **3NF:** The database is in 2NF and contains no transitive functional dependencies. Scheme category details are extracted into a separate `categories` table with `category_id` as foreign key, rather than storing redundant `category_name` and `description` inside every scheme row.

### Q2. What is the difference between a Stored Procedure and a Stored Function in MySQL?
**Answer:**
- A **Stored Function** must return exactly one scalar value, can only accept `IN` parameters, and can be used directly inside SQL statements (e.g., in a `SELECT` query or `WHERE` clause). Example: `fn_calculate_scheme_status()`.
- A **Stored Procedure** can accept `IN`, `OUT`, and `INOUT` parameters, can return full result sets (tabular data) or no return values, can execute transaction management (`START TRANSACTION`, `COMMIT`, `ROLLBACK`), and is invoked using the `CALL` statement. Example: `sp_add_scheme()`.

### Q3. How does a SQL Cursor work and why is it used?
**Answer:** A SQL cursor allows row-by-row processing of query results returned by a `SELECT` statement. While standard SQL operates on entire sets of rows, a cursor allows procedural processing where each row is fetched and evaluated individually. In this project:
1. `DECLARE cur_schemes CURSOR FOR SELECT ...` defines the query.
2. `DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;` handles the end of the result set.
3. `OPEN cur_schemes;` opens the cursor.
4. `FETCH cur_schemes INTO ...;` loads individual row data in a loop.
5. `CLOSE cur_schemes;` releases cursor memory.
Our procedure `sp_generate_scheme_status_report()` demonstrates a complete cursor loop.

### Q4. What is a Database Trigger? What triggers did you implement?
**Answer:** A trigger is a named database object associated with a table that activates automatically when an `INSERT`, `UPDATE`, or `DELETE` event occurs on that table. In our project:
- `trg_before_scheme_insert` (BEFORE INSERT): Enforces that `end_date >= start_date`, aborting invalid inserts using `SIGNAL SQLSTATE '45000'`.
- `trg_after_scheme_insert` (AFTER INSERT): Automatically inserts an audit record in `scheme_audit_log`.
- `trg_after_scheme_update` (AFTER UPDATE): Detects changes in publication status and records them in the audit log.
- `trg_before_scheme_delete` (BEFORE DELETE): Preserves the scheme name and admin ID in `scheme_audit_log` before physical deletion.

### Q5. What is a Database View? Why did you create `v_published_schemes`?
**Answer:** A view is a virtual table based on the result set of an underlying SQL query. It does not store physical data itself (unless materialized). We created `v_published_schemes` to:
1. Encapsulate security: filter out `draft` and `unpublished` schemes so public endpoints never accidentally expose unapproved data.
2. Encapsulate business logic: join schemes with categories and dynamically calculate `application_status` (Open, Upcoming, Closed) and `days_remaining` using `CURDATE()`.

### Q6. How do you prevent SQL Injection in your backend?
**Answer:** We never concatenate user input into raw SQL queries. Instead, we use **parameterized queries (prepared statements)** provided by `mysql2/promise`. In prepared statements, query templates are pre-compiled by the database with `?` placeholders, and parameters are passed separately, ensuring the database treats user input strictly as literal values rather than executable SQL commands.

### Q7. What are Foreign Key cascade options and how did you configure them?
**Answer:**
- `ON DELETE CASCADE`: When the parent row is deleted, all matching child rows are automatically deleted. We used this for `eligibility_criteria` and `required_documents` linked to a scheme.
- `ON DELETE RESTRICT`: Prevents deletion of the parent if any child rows reference it. Used between `schemes` and `categories` so an admin cannot delete a category that still has active schemes.
- `ON DELETE SET NULL`: Sets the foreign key column in the child table to `NULL` when the parent is deleted. Used in `scheme_audit_log` so historical audit entries remain intact even if a scheme or admin is deleted.

### Q8. Why does your schema store `date_of_birth` instead of static `age`?
**Answer:** Storing age directly violates normalization best practices because age changes every year, causing stored values to become stale. Storing `date_of_birth` preserves an invariant atomic truth. Age is derived on-the-fly using `fn_calculate_user_age()` in MySQL or `calculateAge()` in Node.js.

---

## 2. Full-Stack Architecture & Security Questions

### Q9. Explain your application's layered architecture.
**Answer:** The application follows a 5-tier architecture:
1. **Frontend (Presentation):** Plain HTML5, CSS3, and Vanilla JavaScript interacting via `Fetch API`.
2. **Routes & Middleware:** Express router handles URL dispatching, authentication checks (`requireUserAuth`, `requireAdminAuth`), CSRF validation, and input validation.
3. **Controllers:** Extract request parameters, orchestrate service calls, and return standard JSON responses.
4. **Services / Business Logic:** Handles domain operations (multi-table transactions in `schemeService.js`, rule evaluation in `eligibilityService.js`).
5. **Models (Data Access):** Executes prepared SQL statements against MySQL connection pool.

### Q10. What is CSRF and how does your project protect against it?
**Answer:** Cross-Site Request Forgery (CSRF) occurs when a malicious website tricks an authenticated user's browser into executing unauthorized requests on another website. We protect against CSRF by:
1. Generating a cryptographically random `csrfToken` stored in the user's server-side session.
2. Requiring mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) to provide this token via the `x-csrf-token` HTTP header.
3. Verifying the token in `csrfMiddleware.js` before executing any state changes.

### Q11. How is citizen and admin authentication managed?
**Answer:** We use server-side sessions via `express-session` backed by cryptographically secure cookies (`HttpOnly`, `SameSite: Lax`). Passwords are never stored in plaintext; they are hashed using `bcryptjs` with 10 salt rounds. Upon successful login, the session ID is regenerated to prevent session fixation attacks.

### Q12. How does the Eligibility Recommendation Engine work?
**Answer:** The engine lives in `src/utils/eligibilityEngine.js`:
1. It retrieves configured criteria for a scheme from MySQL.
2. It validates the criterion types and operators against strict allowlists.
3. It extracts matching user demographic attributes from their profile.
4. If any mandatory criterion fails, it returns `Not Eligible`.
5. If no mandatory rule fails but required data is missing, it returns `More Information Required`.
6. If all mandatory rules pass, it returns `Likely Eligible` with a complete rule-by-rule breakdown.
7. An educational disclaimer is attached explaining that final approvals depend on official department verification.
