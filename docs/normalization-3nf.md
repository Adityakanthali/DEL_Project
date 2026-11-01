# Relational Normalization: UNF to 3NF Analysis
**Project:** Government Scheme Management and Eligibility Recommendation System  
**Academic Requirement:** Detailed Normalization Explanation and Justification for College Examination & Viva  

---

## 1. Introduction to Normalization
Normalization is a systematic database design technique that organizes tables to minimize data redundancy and prevent insertion, update, and deletion anomalies. In this project, the database schema has been normalized up to **Third Normal Form (3NF)**.

---

## 2. Unnormalized Form (UNF) Example
Consider an unnormalized, flat spreadsheet or single table representation where a single record contains all scheme, category, criteria, and citizen bookmark information:

### Unnormalized Table: `UNF_GOVERNMENT_SCHEMES`
| Scheme_Name | Category_Name | Category_Desc | Start_Date | End_Date | Criteria_List | Required_Docs | Saved_By_Citizens |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| PM-KISAN | Agriculture | Farming credit & input support | 2019-02-01 | 2028-12-31 | Occupation=Farmer, MinAge>=18, MaxIncome<=300000 | Aadhaar, 7/12 Extract, Bank Passbook | Rahul Sharma (rahul@ex.com), Anita (anita@ex.com) |
| Post-Matric SC/ST | Education | Higher education aid | 2020-04-01 | 2027-03-31 | Beneficiary=SC, MaxIncome<=250000 | Caste Cert, Marksheet, College ID | Priya Patel (priya@ex.com) |

### Anomalies in UNF:
1. **Repeating Groups / Non-Atomic Values:** `Criteria_List`, `Required_Docs`, and `Saved_By_Citizens` contain comma-separated multi-valued lists. It is impossible to index or query whether a scheme has `MinAge >= 18` using standard relational operators.
2. **Update Anomaly:** If the description of category "Agriculture" changes, it must be updated in dozens of scheme rows. Missing a single row leads to data inconsistency.
3. **Insertion Anomaly:** A new welfare category cannot be introduced into the system without having an existing scheme to associate with it.
4. **Deletion Anomaly:** If the only scheme in a category (e.g. Housing) is deleted, all knowledge of that category's existence is permanently lost.

---

## 3. First Normal Form (1NF)

### 1NF Definition:
A relation is in **1NF** if and only if all underlying domains contain **atomic (indivisible) values**, there are **no repeating groups**, and each row can be uniquely identified by a Primary Key.

### Conversion to 1NF:
1. Flatten repeated and comma-separated groups into individual atomic records.
2. Separate multi-valued criteria, documents, and citizen bookmarks into dedicated candidate relations.
3. Establish unique primary keys for every entity.

At 1NF, we split multi-valued attributes into rows:
- `SCHEMES_1NF`: `(scheme_id, scheme_name, category_id, category_name, category_desc, start_date, end_date, applicable_scope)`
- `CRITERIA_1NF`: `(criterion_id, scheme_id, criterion_type, operator, criterion_value, is_mandatory)`
- `DOCUMENTS_1NF`: `(document_id, scheme_id, document_name, description, is_mandatory)`
- `USER_SAVED_1NF`: `(user_id, scheme_id, user_name, user_email, saved_at)`

---

## 4. Second Normal Form (2NF)

### 2NF Definition:
A relation is in **2NF** if:
1. It is already in **1NF**.
2. **No non-prime attribute is partially dependent on any candidate key** of the relation (i.e. full functional dependency on the entire primary key).

*Note:* Partial dependency can only exist in tables with composite primary keys. If a table's primary key is a single attribute, it automatically satisfies 2NF!

### Examination of Composite Key Table: `user_saved_schemes`
- Primary Key: `(user_id, scheme_id)` (Composite)
- Non-key attribute: `saved_at`

Functional Dependency Analysis:
- `(user_id, scheme_id) -> saved_at` (Full functional dependency)
- Notice that in our normalized design, citizen name and scheme title are **not** stored in this table. 
- If `user_name` or `scheme_name` were stored in `user_saved_schemes`:
  - `user_id -> user_name` (Partial dependency on part of the composite key $\implies$ violates 2NF!)
- **Resolution:** `user_saved_schemes` contains only `(user_id, scheme_id, saved_at)`, linking `users` and `schemes` without partial dependencies.

Therefore, all tables satisfy **2NF**.

---

## 5. Third Normal Form (3NF)

### 3NF Definition:
A relation is in **3NF** if:
1. It is already in **2NF**.
2. **No non-prime attribute is transitively dependent on the primary key** (i.e., $X \rightarrow Y$ and $Y \rightarrow Z$, where $Z$ is a non-prime attribute and $Y$ is not a candidate key).

### Examination of Transitive Dependency in Schemes:
In `SCHEMES_2NF`:
- Primary Key: `scheme_id`
- Functional Dependencies:
  - `scheme_id -> category_id`
  - `category_id -> category_name, category_description`
  - Consequently, `scheme_id -> category_name` is a **transitive dependency** through `category_id`!

### Anomalies Caused by Transitive Dependency:
- **Update Anomaly:** Updating the description of "Agriculture & Farmers Welfare" would require updating every scheme belonging to that category.
- **Insertion Anomaly:** You cannot create an empty category without inventing a dummy scheme.
- **Deletion Anomaly:** Deleting all schemes in a category deletes the category itself.

### Resolution to 3NF:
Decompose into two separate relations:
1. **`categories`:** `(category_id [PK], category_name, description, created_at)`
   - Functional dependency: `category_id -> category_name, description` (No transitive dependencies).
2. **`schemes`:** `(scheme_id [PK], scheme_name, short_description, description, benefits, category_id [FK], start_date, end_date, ...)`
   - `scheme_id -> category_id` (Direct dependency on foreign key).

Similarly:
- Citizen age is not stored as a static column in `users` because `date_of_birth -> age` would create a redundant, stale dependency. Instead, `date_of_birth` is stored and age is derived dynamically via stored function `fn_calculate_user_age()` and utility methods.

---

## 6. Summary of Final 3NF Relational Schema

| Relation | Primary Key | Foreign Keys | Functional Dependencies |
| :--- | :--- | :--- | :--- |
| **`admins`** | `admin_id` | None | `admin_id -> full_name, email, password_hash, role, is_active` |
| **`users`** | `user_id` | None | `user_id -> full_name, email, password_hash, date_of_birth, state, district, occupation, annual_income, education_level, beneficiary_group` |
| **`categories`** | `category_id` | None | `category_id -> category_name, description` |
| **`schemes`** | `scheme_id` | `category_id`, `created_by_admin_id` | `scheme_id -> scheme_name, short_description, description, benefits, category_id, start_date, end_date, applicable_scope, applicable_state, official_application_url, official_source_url, source_last_verified_at, publication_status, created_by_admin_id` |
| **`eligibility_criteria`** | `criterion_id` | `scheme_id` | `criterion_id -> scheme_id, criterion_type, operator, criterion_value, is_mandatory, description` |
| **`required_documents`** | `document_id` | `scheme_id` | `document_id -> scheme_id, document_name, description, is_mandatory` |
| **`user_saved_schemes`** | `(user_id, scheme_id)` | `user_id`, `scheme_id` | `(user_id, scheme_id) -> saved_at` |
| **`scheme_audit_log`** | `audit_id` | `admin_id`, `scheme_id` | `audit_id -> admin_id, scheme_id, action_type, description, changed_at` |

**Conclusion:** The final schema is strictly in **3NF**, eliminating all redundancy, partial dependencies, and transitive dependencies while ensuring referential integrity through foreign keys.
