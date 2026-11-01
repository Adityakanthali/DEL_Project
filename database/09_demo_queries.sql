-- ============================================================================
-- SCRIPT 09: DEMONSTRATION QUERIES FOR COLLEGE PRESENTATION & VIVA
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7
-- Description: Complete suite of 21 required SQL queries demonstrating DDL, DML,
--              Joins, Subqueries, Aggregation, HAVING, Filtering, and Set operations.
-- ============================================================================

USE government_scheme_db;

-- ----------------------------------------------------------------------------
-- QUERY 1: Display all published schemes with computed application status
-- Concept: SELECT with View and dynamic column calculation
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    category_name,
    applicable_scope,
    applicable_state,
    start_date,
    end_date,
    application_status
FROM v_published_schemes
ORDER BY scheme_name ASC;

-- ----------------------------------------------------------------------------
-- QUERY 2: Search schemes by exact or prefix name
-- Concept: LIKE operator with parameterized prefix matching
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    category_name,
    start_date,
    end_date
FROM v_published_schemes
WHERE scheme_name LIKE 'Pradhan Mantri%'
ORDER BY scheme_name ASC;

-- ----------------------------------------------------------------------------
-- QUERY 3: Search schemes by general keyword (in title, description, or benefits)
-- Concept: Multi-column textual searching with OR conditions
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    short_description,
    benefits
FROM v_published_schemes
WHERE scheme_name LIKE '%scholarship%'
   OR short_description LIKE '%scholarship%'
   OR description LIKE '%scholarship%'
   OR benefits LIKE '%scholarship%';

-- ----------------------------------------------------------------------------
-- QUERY 4: Filter schemes by category name
-- Concept: Filtering on joined attribute
-- ----------------------------------------------------------------------------
SELECT
    s.scheme_id,
    s.scheme_name,
    c.category_name,
    s.benefits
FROM schemes s
INNER JOIN categories c ON s.category_id = c.category_id
WHERE c.category_name = 'Agriculture & Farmers Welfare'
  AND s.publication_status = 'published';

-- ----------------------------------------------------------------------------
-- QUERY 5: Display currently open schemes
-- Concept: Date range filtering with CURRENT_DATE and NULL handling
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    start_date,
    end_date,
    official_application_url
FROM v_published_schemes
WHERE application_status = 'Open';

-- ----------------------------------------------------------------------------
-- QUERY 6: Display upcoming schemes (opening date in future)
-- Concept: Temporal comparison with CURDATE()
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    start_date,
    category_name,
    DATEDIFF(start_date, CURDATE()) AS days_until_opening
FROM v_published_schemes
WHERE application_status = 'Upcoming';

-- ----------------------------------------------------------------------------
-- QUERY 7: Display schemes whose closing dates are approaching (within 365 days)
-- Concept: Date arithmetic using DATEDIFF and BETWEEN
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    category_name,
    end_date,
    DATEDIFF(end_date, CURDATE()) AS days_remaining
FROM v_published_schemes
WHERE application_status = 'Open'
  AND end_date IS NOT NULL
  AND DATEDIFF(end_date, CURDATE()) <= 365
ORDER BY days_remaining ASC;

-- ----------------------------------------------------------------------------
-- QUERY 8: Join schemes with categories
-- Concept: INNER JOIN between parent and child tables (1-to-Many)
-- ----------------------------------------------------------------------------
SELECT
    s.scheme_id,
    s.scheme_name,
    c.category_id,
    c.category_name,
    s.applicable_scope,
    s.publication_status
FROM schemes s
INNER JOIN categories c ON s.category_id = c.category_id
ORDER BY c.category_name, s.scheme_name;

-- ----------------------------------------------------------------------------
-- QUERY 9: Join schemes with eligibility criteria
-- Concept: Multi-table JOIN with criteria condition types and operators
-- ----------------------------------------------------------------------------
SELECT
    s.scheme_id,
    s.scheme_name,
    ec.criterion_type,
    ec.operator,
    ec.criterion_value,
    ec.is_mandatory,
    ec.description AS criteria_description
FROM schemes s
INNER JOIN eligibility_criteria ec ON s.scheme_id = ec.scheme_id
WHERE s.publication_status = 'published'
ORDER BY s.scheme_id, ec.is_mandatory DESC;

-- ----------------------------------------------------------------------------
-- QUERY 10: Join schemes with required documents
-- Concept: Relational JOIN displaying 1-to-many document requirements
-- ----------------------------------------------------------------------------
SELECT
    s.scheme_id,
    s.scheme_name,
    rd.document_name,
    rd.description AS document_note,
    rd.is_mandatory
FROM schemes s
INNER JOIN required_documents rd ON s.scheme_id = rd.scheme_id
WHERE s.publication_status = 'published'
ORDER BY s.scheme_id, rd.is_mandatory DESC;

-- ----------------------------------------------------------------------------
-- QUERY 11: Count schemes by category
-- Concept: Aggregate function COUNT() with GROUP BY
-- ----------------------------------------------------------------------------
SELECT
    c.category_id,
    c.category_name,
    COUNT(s.scheme_id) AS total_schemes,
    SUM(CASE WHEN s.publication_status = 'published' THEN 1 ELSE 0 END) AS published_schemes
FROM categories c
LEFT JOIN schemes s ON c.category_id = s.category_id
GROUP BY c.category_id, c.category_name
ORDER BY total_schemes DESC;

-- ----------------------------------------------------------------------------
-- QUERY 12: Find the category with the highest number of schemes
-- Concept: Nested Subquery with MAX() aggregate
-- ----------------------------------------------------------------------------
SELECT
    category_id,
    category_name,
    total_schemes
FROM (
    SELECT
        c.category_id,
        c.category_name,
        COUNT(s.scheme_id) AS total_schemes
    FROM categories c
    LEFT JOIN schemes s ON c.category_id = s.category_id
    GROUP BY c.category_id, c.category_name
) AS cat_counts
WHERE total_schemes = (
    SELECT MAX(scheme_count)
    FROM (
        SELECT COUNT(scheme_id) AS scheme_count
        FROM schemes
        GROUP BY category_id
    ) AS inner_counts
);

-- ----------------------------------------------------------------------------
-- QUERY 13: Filter schemes by state (e.g. Maharashtra or National)
-- Concept: Conditional logic combining National and State scopes
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    category_name,
    applicable_scope,
    applicable_state
FROM v_published_schemes
WHERE applicable_scope = 'National'
   OR (applicable_scope = 'State' AND applicable_state = 'Maharashtra');

-- ----------------------------------------------------------------------------
-- QUERY 14: Filter schemes by occupation (e.g., schemes targeting Farmers)
-- Concept: JOIN filtering on criteria attributes
-- ----------------------------------------------------------------------------
SELECT DISTINCT
    s.scheme_id,
    s.scheme_name,
    c.category_name,
    ec.criterion_value AS targeted_occupation,
    ec.description AS eligibility_requirement
FROM schemes s
INNER JOIN categories c ON s.category_id = c.category_id
INNER JOIN eligibility_criteria ec ON s.scheme_id = ec.scheme_id
WHERE ec.criterion_type = 'occupation'
  AND ec.criterion_value = 'Farmer'
  AND s.publication_status = 'published';

-- ----------------------------------------------------------------------------
-- QUERY 15: Find schemes whose maximum income criterion meets a threshold
-- Concept: Casting string criterion value to DECIMAL and evaluating numeric comparison
-- ----------------------------------------------------------------------------
SELECT
    s.scheme_id,
    s.scheme_name,
    c.category_name,
    CAST(ec.criterion_value AS DECIMAL(12,2)) AS max_income_limit,
    ec.description AS criteria_explanation
FROM schemes s
INNER JOIN categories c ON s.category_id = c.category_id
INNER JOIN eligibility_criteria ec ON s.scheme_id = ec.scheme_id
WHERE ec.criterion_type = 'max_income'
  AND CAST(ec.criterion_value AS DECIMAL(12,2)) >= 250000.00
  AND s.publication_status = 'published'
ORDER BY max_income_limit DESC;

-- ----------------------------------------------------------------------------
-- QUERY 16: Display saved schemes for a specific user (e.g. User ID = 1)
-- Concept: Many-to-Many junction query linking Users and Schemes
-- ----------------------------------------------------------------------------
SELECT
    uss.user_id,
    u.full_name AS citizen_name,
    s.scheme_id,
    s.scheme_name,
    c.category_name,
    fn_calculate_scheme_status(s.publication_status, s.start_date, s.end_date) AS status,
    uss.saved_at
FROM user_saved_schemes uss
INNER JOIN users u ON uss.user_id = u.user_id
INNER JOIN schemes s ON uss.scheme_id = s.scheme_id
INNER JOIN categories c ON s.category_id = c.category_id
WHERE uss.user_id = 1
ORDER BY uss.saved_at DESC;

-- ----------------------------------------------------------------------------
-- QUERY 17: Count published, upcoming, open, and closed schemes across the portal
-- Concept: Conditional aggregation using SUM(CASE...)
-- ----------------------------------------------------------------------------
SELECT
    COUNT(*) AS total_schemes_in_db,
    SUM(CASE WHEN publication_status = 'published' THEN 1 ELSE 0 END) AS total_published,
    SUM(CASE WHEN publication_status = 'draft' THEN 1 ELSE 0 END) AS total_drafts,
    SUM(CASE
        WHEN publication_status = 'published' AND CURDATE() < start_date
        THEN 1 ELSE 0
    END) AS total_upcoming,
    SUM(CASE
        WHEN publication_status = 'published' AND CURDATE() >= start_date AND (end_date IS NULL OR CURDATE() <= end_date)
        THEN 1 ELSE 0
    END) AS total_open,
    SUM(CASE
        WHEN publication_status = 'published' AND end_date IS NOT NULL AND CURDATE() > end_date
        THEN 1 ELSE 0
    END) AS total_closed
FROM schemes;

-- ----------------------------------------------------------------------------
-- QUERY 18: Correlated subquery to find schemes having more than 2 criteria
-- Concept: Subquery in WHERE clause with correlation to outer table
-- ----------------------------------------------------------------------------
SELECT
    s.scheme_id,
    s.scheme_name,
    c.category_name,
    (SELECT COUNT(*) FROM eligibility_criteria ec WHERE ec.scheme_id = s.scheme_id) AS criteria_count
FROM schemes s
INNER JOIN categories c ON s.category_id = c.category_id
WHERE (
    SELECT COUNT(*)
    FROM eligibility_criteria ec
    WHERE ec.scheme_id = s.scheme_id
) >= 2
ORDER BY criteria_count DESC;

-- ----------------------------------------------------------------------------
-- QUERY 19: Categories having at least 2 published schemes
-- Concept: GROUP BY with HAVING clause filtering on aggregate
-- ----------------------------------------------------------------------------
SELECT
    c.category_id,
    c.category_name,
    COUNT(s.scheme_id) AS published_scheme_count
FROM categories c
INNER JOIN schemes s ON c.category_id = s.category_id
WHERE s.publication_status = 'published'
GROUP BY c.category_id, c.category_name
HAVING COUNT(s.scheme_id) >= 2
ORDER BY published_scheme_count DESC;

-- ----------------------------------------------------------------------------
-- QUERY 20: Top 5 recently updated published schemes (Pagination Demo)
-- Concept: ORDER BY with LIMIT and OFFSET
-- ----------------------------------------------------------------------------
SELECT
    scheme_id,
    scheme_name,
    category_name,
    start_date,
    updated_at
FROM v_published_schemes
ORDER BY updated_at DESC
LIMIT 5 OFFSET 0;

-- ----------------------------------------------------------------------------
-- QUERY 21: Demonstration of All Four Main DML Operations in a Safe Transaction
-- Concept: INSERT, SELECT, UPDATE, DELETE with ROLLBACK demonstration
-- ----------------------------------------------------------------------------
START TRANSACTION;

-- DML 1: INSERT a temporary scheme record
INSERT INTO schemes (
    scheme_name, short_description, description, benefits,
    category_id, start_date, end_date, applicable_scope,
    publication_status, created_by_admin_id
) VALUES (
    'Test Drone Subsidy Scheme 2026',
    'Demonstration scheme for testing all 4 DML operations.',
    'Provides financial aid for purchase of agricultural spraying drones.',
    'Up to 50% subsidy or maximum Rs. 5 Lakh for farmer collectives.',
    1, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 180 DAY), 'National',
    'draft', 1
);

SET @demo_scheme_id = LAST_INSERT_ID();

-- DML 2: SELECT to verify insertion
SELECT scheme_id, scheme_name, publication_status
FROM schemes
WHERE scheme_id = @demo_scheme_id;

-- DML 3: UPDATE the record (publish it)
UPDATE schemes
SET publication_status = 'published',
    benefits = 'Updated: 60% subsidy for women SHGs.'
WHERE scheme_id = @demo_scheme_id;

-- Verify update
SELECT scheme_id, scheme_name, publication_status, benefits
FROM schemes
WHERE scheme_id = @demo_scheme_id;

-- DML 4: DELETE the record safely
DELETE FROM schemes
WHERE scheme_id = @demo_scheme_id;

-- Verify deletion (returns empty)
SELECT scheme_id, scheme_name
FROM schemes
WHERE scheme_id = @demo_scheme_id;

-- Rollback transaction to leave database clean
ROLLBACK;

SELECT 'All 21 demonstration queries executed and ready for presentation!' AS status_message;
