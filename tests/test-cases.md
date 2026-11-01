# Test Suite and Test Cases Specification
**Project:** Government Scheme Management and Eligibility Recommendation System  
**Academic Context:** College DBMS Mini-Project (Computer Engineering)  

---

## 1. Test Overview and Methodology

This document specifies the verification checklist and execution outcomes across:
1. **Authentication & Authorization Tests**
2. **Administrative & Scheme Management Tests**
3. **Citizen Search, Filtering, and Sorting Tests**
4. **Eligibility Recommendation Engine Tests**
5. **MySQL Relational Database Integrity & Routine Tests**
6. **Security & Vulnerability Protection Tests**

---

## 2. Detailed Test Matrix

| Test ID | Module | Scenario / Input | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **AUTH-01** | Auth | Register with valid details (`test@example.com`, pass: `Test@123`) | HTTP 201 Created; Password hashed with bcrypt; user session initialized | HTTP 201 Created, password_hash in DB, session created | **PASSED** |
| **AUTH-02** | Auth | Register with existing email | HTTP 409 Conflict with message "email already registered" | HTTP 409 Conflict, duplicate prevented | **PASSED** |
| **AUTH-03** | Auth | Register with mismatched confirm password | HTTP 400 Bad Request: "Passwords do not match" | HTTP 400 Bad Request returned | **PASSED** |
| **AUTH-04** | Auth | Citizen Login with valid credentials (`rahul.sharma@example.com` / `Citizen@123`) | HTTP 200 OK; Session ID regenerated; User object returned | HTTP 200 OK, session cookie issued | **PASSED** |
| **AUTH-05** | Auth | Login with incorrect password | HTTP 401 Unauthorized: "Invalid email or password" (generic message) | HTTP 401 Unauthorized returned | **PASSED** |
| **AUTH-06** | Auth | Citizen attempts to access `/admin-dashboard.html` or `/api/admin/schemes` | HTTP 403 Forbidden: "Administrative privileges required" | HTTP 403 Forbidden returned | **PASSED** |
| **AUTH-07** | Auth | Admin Login (`admin@govscheme.in` / `Admin@123`) | HTTP 200 OK; Admin session created; redirects to `/admin-dashboard.html` | HTTP 200 OK, admin session verified | **PASSED** |
| **AUTH-08** | Auth | User Logout via `POST /api/auth/logout` | Session destroyed; `connect.sid` cookie cleared | HTTP 200 OK, session destroyed | **PASSED** |
| **SCH-01** | Schemes | Retrieve published schemes catalog | Only schemes with `publication_status = 'published'` returned | Drafts and unverified hidden from public query | **PASSED** |
| **SCH-02** | Schemes | Search by keyword `"Kisan"` | Returns all schemes containing "Kisan" in name, description, or benefits | Matching schemes returned | **PASSED** |
| **SCH-03** | Schemes | Filter schemes by Category (`Agriculture & Farmers Welfare`) | Returns schemes mapped to `category_id = 1` | Correct schemes filtered | **PASSED** |
| **SCH-04** | Schemes | Filter schemes by State (`Maharashtra`) | Returns National schemes + schemes with `applicable_state = 'Maharashtra'` | National and state schemes returned | **PASSED** |
| **SCH-05** | Schemes | Filter by Status (`Open`) | Schemes where `CURDATE() >= start_date` and `CURDATE() <= end_date` (or `end_date IS NULL`) | Accurately computed by date math | **PASSED** |
| **SCH-06** | Schemes | Sort schemes by Closing Date (`end_date ASC`) | Schemes with nearest deadlines listed first | Sorted in ascending order of deadline | **PASSED** |
| **SCH-07** | Schemes | Scheme Details view (`GET /api/schemes/1`) | Full metadata + joined criteria list + required documents + bookmark state | Complete payload delivered | **PASSED** |
| **ELIG-01** | Engine | Applicant age 22 evaluated against `min_age >= 18` | Status: `passed`, explanation: "Satisfied" | Rule satisfied | **PASSED** |
| **ELIG-02** | Engine | Applicant age 16 evaluated against `min_age >= 18` (Mandatory) | Overall status: `Not Eligible`, criterion: `failed` | Correctly disqualified | **PASSED** |
| **ELIG-03** | Engine | Applicant missing required income value for `max_income <= 250000` | Overall status: `More Information Required` | Prompted to provide income value | **PASSED** |
| **ELIG-04** | Engine | Applicant with matching occupation "Farmer" vs target "farmer" | Case-insensitive match -> `passed` | Evaluated successfully | **PASSED** |
| **ELIG-05** | Engine | Scheme with zero criteria configured | Status: `More Information Required` (Official notification disclaimer) | Clear explanation returned | **PASSED** |
| **ELIG-06** | Engine | Multi-criteria scheme: mandatory pass, optional fail | Overall status: `Likely Eligible` (with advisory note) | Passed with warning | **PASSED** |
| **ADMIN-01** | Admin | Create scheme with invalid dates (`end_date < start_date`) | HTTP 400 Bad Request / MySQL Check Constraint rejection | Rejected by backend validator and MySQL trigger | **PASSED** |
| **ADMIN-02** | Admin | Create scheme with criteria and documents in atomic transaction | All records inserted into `schemes`, `eligibility_criteria`, `required_documents`, and `scheme_audit_log` | Transaction committed atomically | **PASSED** |
| **ADMIN-03** | Admin | Toggle publication status from `draft` to `published` | Status updated; audit entry recorded in `scheme_audit_log` | Action logged in audit table | **PASSED** |
| **ADMIN-04** | Admin | Delete scheme | Scheme removed; associated criteria/docs cascaded; audit log preserved with `scheme_id = NULL` | Audit history preserved via `ON DELETE SET NULL` | **PASSED** |
| **ADMIN-05** | Admin | Attempt to delete category referenced by schemes | HTTP 400 Bad Request: "Cannot delete category with associated schemes" | Referential integrity protected | **PASSED** |
| **SEC-01** | Security | SQL Injection attempt: `' OR 1=1 --` in search bar or form inputs | Handled safely by prepared statement placeholders (`?`) in `mysql2` | Treated as literal text; no injection possible | **PASSED** |
| **SEC-02** | Security | Cross-Site Scripting (XSS): `<script>alert('xss')</script>` in scheme title | Frontend escapes HTML via `escapeHtml()` helper before insertion | Rendered as escaped text; script not executed | **PASSED** |
| **SEC-03** | Security | Mutating POST request without CSRF token | HTTP 403 Forbidden: "Invalid or missing CSRF token" | Request blocked | **PASSED** |
| **SEC-04** | Security | Password verification | Passwords stored strictly as bcrypt hashes with salt rounds = 10; never exposed in API | Password hashes protected | **PASSED** |

---

## 3. Database Routines Execution Checklist

- [x] **DDL & Constraints Execution:** Foreign keys (`ON DELETE CASCADE`, `ON DELETE SET NULL`), Check constraints (`annual_income >= 0`, `end_date >= start_date`).
- [x] **Views Execution:** `v_published_schemes` calculates real-time `application_status`; `v_scheme_category_summary` aggregates category counts.
- [x] **Stored Functions:** `fn_calculate_scheme_status` and `fn_calculate_user_age` tested.
- [x] **Stored Procedures:** `sp_get_open_schemes`, `sp_get_scheme_details`, `sp_get_category_summary`, and `sp_add_scheme` verified.
- [x] **Cursor Demonstration:** `sp_generate_scheme_status_report` iterates over schemes using `CURSOR`, handles `NOT FOUND`, and outputs formatted summary table.
- [x] **Triggers:** `trg_before_scheme_insert`, `trg_after_scheme_insert`, `trg_after_scheme_update`, and `trg_before_scheme_delete` verified.
