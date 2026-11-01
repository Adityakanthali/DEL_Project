-- ============================================================================
-- SCRIPT 05: VIEWS (VIRTUAL TABLES)
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7
-- Description: Demonstrates SQL Views for business reporting, simplifying complex
--              joins, and calculating dynamic application status without redundancy.
-- ============================================================================

USE government_scheme_db;

-- ----------------------------------------------------------------------------
-- VIEW 1: v_published_schemes
-- Encapsulates business logic for citizen-facing scheme discovery.
-- Computes the dynamic application_status (Open, Upcoming, Closed) in real-time
-- relative to CURDATE(), hiding drafts and unverified records.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_published_schemes AS
SELECT
    s.scheme_id,
    s.scheme_name,
    s.short_description,
    s.description,
    s.benefits,
    s.category_id,
    c.category_name,
    s.start_date,
    s.end_date,
    s.applicable_scope,
    s.applicable_state,
    s.official_application_url,
    s.official_source_url,
    s.source_last_verified_at,
    s.publication_status,
    CASE
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
    END AS application_status,
    DATEDIFF(s.end_date, CURDATE()) AS days_remaining,
    s.created_at,
    s.updated_at
FROM schemes s
INNER JOIN categories c ON s.category_id = c.category_id
WHERE s.publication_status = 'published';

-- ----------------------------------------------------------------------------
-- VIEW 2: v_scheme_category_summary
-- Aggregates statistical metrics across each scheme category.
-- Used for the Admin Dashboard and Public Homepage overview cards.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_scheme_category_summary AS
SELECT
    c.category_id,
    c.category_name,
    c.description AS category_description,
    COUNT(s.scheme_id) AS total_schemes,
    SUM(CASE WHEN s.publication_status = 'published' THEN 1 ELSE 0 END) AS published_schemes,
    SUM(CASE
        WHEN s.publication_status = 'published'
         AND CURDATE() >= s.start_date
         AND (s.end_date IS NULL OR CURDATE() <= s.end_date)
        THEN 1 ELSE 0
    END) AS open_schemes,
    SUM(CASE
        WHEN s.publication_status = 'published'
         AND CURDATE() < s.start_date
        THEN 1 ELSE 0
    END) AS upcoming_schemes,
    SUM(CASE
        WHEN s.publication_status = 'published'
         AND s.end_date IS NOT NULL
         AND CURDATE() > s.end_date
        THEN 1 ELSE 0
    END) AS closed_schemes
FROM categories c
LEFT JOIN schemes s ON c.category_id = s.category_id
GROUP BY c.category_id, c.category_name, c.description;

-- ----------------------------------------------------------------------------
-- VIEW 3: v_user_saved_schemes_detail
-- Joins bookmarks with scheme metadata and dynamic status for citizen portal.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW v_user_saved_schemes_detail AS
SELECT
    uss.user_id,
    u.full_name AS user_name,
    u.email AS user_email,
    uss.scheme_id,
    s.scheme_name,
    s.short_description,
    c.category_name,
    s.start_date,
    s.end_date,
    s.applicable_scope,
    s.applicable_state,
    s.official_application_url,
    s.publication_status,
    CASE
        WHEN CURDATE() < s.start_date THEN 'Upcoming'
        WHEN s.end_date IS NOT NULL AND CURDATE() > s.end_date THEN 'Closed'
        ELSE 'Open'
    END AS application_status,
    uss.saved_at
FROM user_saved_schemes uss
INNER JOIN users u ON uss.user_id = u.user_id
INNER JOIN schemes s ON uss.scheme_id = s.scheme_id
INNER JOIN categories c ON s.category_id = c.category_id;

SELECT 'Views v_published_schemes, v_scheme_category_summary, and v_user_saved_schemes_detail created successfully!' AS status_message;
