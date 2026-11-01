# System Architecture and API Documentation
**Project:** Government Scheme Management and Eligibility Recommendation System  

---

## 1. Layered Architecture Overview

The system adheres to a strict, multi-tiered layered architecture ensuring complete separation of concerns between presentation, routing, business logic, data persistence, and the relational database engine.

```
+--------------------------------------------------------------------------+
|                            PRESENTATION LAYER                            |
|             (HTML5, CSS3, Vanilla JavaScript ES6 Modules, Fetch API)      |
|   Public Portal   |   Citizen Dashboard   |   Admin Management Console   |
+--------------------------------------------------------------------------+
                                     |
                                     | HTTP / HTTPS Requests (JSON Payload)
                                     v
+--------------------------------------------------------------------------+
|                         APPLICATION ROUTING LAYER                        |
|       (Express.js Web Application, Helmet Security, Static Server)       |
|    /api/auth   |   /api/schemes   |   /api/eligibility   |  /api/admin   |
+--------------------------------------------------------------------------+
                                     |
                                     | Passes through Middleware
                                     v
+--------------------------------------------------------------------------+
|                         MIDDLEWARE & SECURITY LAYER                      |
|  - Session Verification (express-session)                                |
|  - Role Guard (requireAdminAuth / requireUserAuth)                       |
|  - CSRF Token Validation (verifyCsrf)                                    |
|  - Input Validation & Sanitization (validateMiddleware)                  |
|  - Centralized Error Handling (errorMiddleware)                          |
+--------------------------------------------------------------------------+
                                     |
                                     | Dispatches to Controllers
                                     v
+--------------------------------------------------------------------------+
|                             CONTROLLER LAYER                             |
|  - authController.js       - schemeController.js    - adminController.js |
|  - eligibilityController.js- userController.js      - categoryController.|
+--------------------------------------------------------------------------+
                                     |
                                     | Invokes Services & Business Logic
                                     v
+--------------------------------------------------------------------------+
|                          SERVICE & ENGINE LAYER                          |
|  - schemeService.js: Multi-table atomic transactions                     |
|  - eligibilityService.js: Rule matching engine & recommendations         |
|  - eligibilityEngine.js: Pure algorithm for criterion evaluation        |
|  - dateUtils.js: Lifecycle timeline and age calculation                  |
+--------------------------------------------------------------------------+
                                     |
                                     | Data Access Objects (DAO)
                                     v
+--------------------------------------------------------------------------+
|                             MODEL LAYER (DAO)                            |
|  - userModel.js       - adminModel.js       - schemeModel.js             |
|  - categoryModel.js   - eligibilityModel.js - documentModel.js           |
|  - savedSchemeModel.js- auditModel.js                                    |
+--------------------------------------------------------------------------+
                                     |
                                     | Parameterized SQL Queries (?)
                                     v
+--------------------------------------------------------------------------+
|                          DATABASE LAYER (MySQL 8.0)                      |
|  - Connection Pool (mysql2/promise)                                      |
|  - 8 Normalized Tables (InnoDB, utf8mb4)                                 |
|  - SQL Views (v_published_schemes, v_scheme_category_summary)            |
|  - Stored Procedures (sp_add_scheme, sp_get_open_schemes)                |
|  - Stored Functions (fn_calculate_scheme_status, fn_calculate_user_age)  |
|  - Cursors (sp_generate_scheme_status_report)                            |
|  - Triggers (BEFORE/AFTER INSERT, UPDATE, DELETE audit & constraints)    |
+--------------------------------------------------------------------------+
```

---

## 2. REST API Specification

### 2.1 Authentication & Session Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Public | Registers a new citizen user. Password hashed with bcrypt. |
| `POST` | `/api/auth/login` | Public | Authenticates citizen. Regenerates session ID. |
| `POST` | `/api/auth/admin-login` | Public | Authenticates administrator against `admins` table. |
| `POST` | `/api/auth/logout` | Authenticated | Destroys active session and invalidates cookie. |
| `GET` | `/api/auth/me` | Public | Returns current session authentication state and CSRF token. |
| `GET` | `/api/auth/csrf-token`| Public | Retrieves active CSRF token for request header injection. |

### 2.2 Public Scheme Discovery Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/schemes` | Public | Paginated scheme catalog with keyword, category, state, occupation, age, income, and status filters. |
| `GET` | `/api/schemes/:id` | Public | Complete scheme details, criteria, required documents, and bookmark status. |
| `GET` | `/api/schemes/featured` | Public | Retrieves featured schemes for public homepage. |
| `GET` | `/api/schemes/closing-soon` | Public | Retrieves open schemes with nearest deadlines. |
| `GET` | `/api/categories` | Public | Retrieves all scheme domains with published scheme counts. |

### 2.3 Eligibility Evaluation Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/eligibility/check` | Public / User | Evaluates user profile against criteria for a specific scheme. Returns status and rule breakdown. |
| `POST` | `/api/eligibility/recommendations` | Public / User | Evaluates user profile across all currently open schemes, ranking them into Likely Eligible, More Info, and Ineligible. |

### 2.4 Citizen User Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/user/profile` | Citizen User | Retrieves citizen profile with dynamically calculated age. |
| `PUT` | `/api/user/profile` | Citizen User | Updates demographic profile fields. |
| `GET` | `/api/user/saved-schemes` | Citizen User | Retrieves list of user's bookmarked schemes. |
| `POST` | `/api/user/saved-schemes/:schemeId` | Citizen User | Adds scheme to user bookmarks in `user_saved_schemes`. |
| `DELETE` | `/api/user/saved-schemes/:schemeId` | Citizen User | Removes scheme from user bookmarks. |

### 2.5 Administrator Protected Endpoints
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/dashboard/stats` | Admin | Returns system KPI counters and category breakdowns. |
| `GET` | `/api/admin/schemes` | Admin | Retrieves all schemes (including drafts and unpublished) with admin metadata. |
| `GET` | `/api/admin/schemes/:id` | Admin | Retrieves scheme with criteria and documents for editing. |
| `POST` | `/api/admin/schemes` | Admin | Transactional scheme creation with criteria, documents, and audit logging. |
| `PUT` | `/api/admin/schemes/:id` | Admin | Transactional scheme update. |
| `PATCH` | `/api/admin/schemes/:id/publication`| Admin | Toggles scheme status (`draft`, `published`, `unpublished`). |
| `DELETE` | `/api/admin/schemes/:id` | Admin | Deletes scheme record safely while preserving audit history. |
| `POST` | `/api/admin/categories` | Admin | Adds a new category domain. |
| `DELETE` | `/api/admin/categories/:id` | Admin | Deletes category after verifying no linked schemes exist. |
| `GET` | `/api/admin/audit-logs` | Admin | Returns chronological administrative audit trail. |
