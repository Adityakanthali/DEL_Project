# Entity-Relationship (ER) Diagram
**Project:** Government Scheme Management and Eligibility Recommendation System  
**Database:** `government_scheme_db` (MySQL 8.0 / InnoDB)  

---

## 1. Mermaid Entity-Relationship Diagram

```mermaid
erDiagram
    admins ||--o{ schemes : "creates / updates"
    admins ||--o{ scheme_audit_log : "performs action"
    categories ||--o{ schemes : "classifies"
    schemes ||--o{ eligibility_criteria : "specifies"
    schemes ||--o{ required_documents : "requires"
    schemes ||--o{ user_saved_schemes : "is bookmarked in"
    schemes ||--o{ scheme_audit_log : "is target of"
    users ||--o{ user_saved_schemes : "bookmarks"

    admins {
        int admin_id PK "AUTO_INCREMENT"
        varchar full_name "Admin Full Name"
        varchar email UK "Unique Login Email"
        varchar password_hash "Bcrypt Hash"
        varchar role "e.g. superadmin, admin"
        boolean is_active "Account status"
        timestamp created_at
        timestamp updated_at
    }

    users {
        int user_id PK "AUTO_INCREMENT"
        varchar full_name "Citizen Full Name"
        varchar email UK "Unique Login Email"
        varchar password_hash "Bcrypt Hash"
        date date_of_birth "DOB for age calculation"
        varchar state "State of Residence"
        varchar district "District / City"
        varchar occupation "Farmer, Student, etc."
        decimal annual_income "Household annual income"
        varchar education_level "8th, 10th, Graduate"
        varchar beneficiary_group "General, SC, ST, OBC"
        boolean is_active "Account status"
        timestamp created_at
        timestamp updated_at
    }

    categories {
        int category_id PK "AUTO_INCREMENT"
        varchar category_name UK "e.g. Agriculture, Education"
        text description "Domain Scope"
        timestamp created_at
    }

    schemes {
        int scheme_id PK "AUTO_INCREMENT"
        varchar scheme_name "Official Program Name"
        varchar short_description "Card summary"
        text description "Full background"
        text benefits "Quantified benefits"
        int category_id FK "References categories(category_id)"
        date start_date "Application opening date"
        date end_date "Closing date (nullable)"
        varchar applicable_scope "National, State, Regional"
        varchar applicable_state "e.g. Maharashtra"
        varchar official_application_url "Official portal link"
        varchar official_source_url "Gazette notification link"
        date source_last_verified_at "Verification date"
        enum publication_status "draft, published, unpublished"
        int created_by_admin_id FK "References admins(admin_id)"
        timestamp created_at
        timestamp updated_at
    }

    eligibility_criteria {
        int criterion_id PK "AUTO_INCREMENT"
        int scheme_id FK "References schemes(scheme_id) ON DELETE CASCADE"
        varchar criterion_type "min_age, max_income, occupation, state"
        varchar operator ">=, <=, =, >, <"
        varchar criterion_value "18, 250000, Farmer"
        boolean is_mandatory "Mandatory vs Advisory"
        varchar description "Human readable rule"
        timestamp created_at
        timestamp updated_at
    }

    required_documents {
        int document_id PK "AUTO_INCREMENT"
        int scheme_id FK "References schemes(scheme_id) ON DELETE CASCADE"
        varchar document_name "Aadhaar Card, 7/12 Extract"
        varchar description "Issuing authority / instructions"
        boolean is_mandatory "Mandatory vs Optional"
        timestamp created_at
    }

    user_saved_schemes {
        int user_id PK, FK "References users(user_id) ON DELETE CASCADE"
        int scheme_id PK, FK "References schemes(scheme_id) ON DELETE CASCADE"
        timestamp saved_at "Timestamp of bookmark"
    }

    scheme_audit_log {
        int audit_id PK "AUTO_INCREMENT"
        int admin_id FK "References admins(admin_id) ON DELETE SET NULL"
        int scheme_id FK "References schemes(scheme_id) ON DELETE SET NULL"
        varchar action_type "SCHEME_CREATED, SCHEME_UPDATED, etc."
        text description "Detailed change description"
        timestamp changed_at "Timestamp of action"
    }
```

---

## 2. Cardinalities and Relationships Explained

1. **Category to Schemes ($1 : N$):**
   - One category can encompass multiple government schemes.
   - Each scheme must belong to exactly one category domain (`category_id` NOT NULL, `ON DELETE RESTRICT`).

2. **Scheme to Eligibility Criteria ($1 : N$):**
   - One scheme defines zero, one, or many atomic criteria rules.
   - Deleting a scheme automatically cascades and removes its dependent criteria (`ON DELETE CASCADE`).

3. **Scheme to Required Documents ($1 : N$):**
   - One scheme specifies multiple mandatory or optional supporting documents.
   - Deleting a scheme automatically cascades and removes its dependent document records (`ON DELETE CASCADE`).

4. **User to Schemes via Saved Schemes ($M : N$):**
   - A citizen can bookmark multiple government schemes.
   - A single scheme can be bookmarked by thousands of citizens.
   - Represented by junction table `user_saved_schemes` with composite primary key `(user_id, scheme_id)`.

5. **Admin to Schemes & Audit Logs ($1 : N$):**
   - An administrator creates schemes and triggers audit log records.
   - If an admin or scheme is deleted, historical audit entries are preserved via `ON DELETE SET NULL`.
