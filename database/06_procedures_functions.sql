-- ============================================================================
-- SCRIPT 06: STORED PROCEDURES AND STORED FUNCTIONS
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7
-- Note: MySQL stored routines syntax (not Oracle PL/SQL).
-- ============================================================================

USE government_scheme_db;

-- ----------------------------------------------------------------------------
-- 1. STORED FUNCTION: fn_calculate_scheme_status
-- Calculates the real-time lifecycle status of a scheme.
-- Returns: 'Draft', 'Unpublished', 'Upcoming', 'Open', or 'Closed'
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_scheme_status;

DELIMITER //

CREATE FUNCTION fn_calculate_scheme_status(
    p_pub_status VARCHAR(20),
    p_start_date DATE,
    p_end_date DATE
)
RETURNS VARCHAR(20)
DETERMINISTIC
READS SQL DATA
BEGIN
    DECLARE v_status VARCHAR(20);

    IF p_pub_status = 'draft' THEN
        SET v_status = 'Draft';
    ELSEIF p_pub_status = 'unpublished' THEN
        SET v_status = 'Unpublished';
    ELSE
        -- Publication status is 'published'
        IF CURDATE() < p_start_date THEN
            SET v_status = 'Upcoming';
        ELSEIF p_end_date IS NOT NULL AND CURDATE() > p_end_date THEN
            SET v_status = 'Closed';
        ELSE
            SET v_status = 'Open';
        END IF;
    END IF;

    RETURN v_status;
END //

-- ----------------------------------------------------------------------------
-- 2. STORED FUNCTION: fn_calculate_user_age
-- Computes precise user age in completed years from Date of Birth.
-- Avoids storing stale age in the database (Normalization best practice).
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS fn_calculate_user_age;

CREATE FUNCTION fn_calculate_user_age(p_dob DATE)
RETURNS INT
DETERMINISTIC
NO SQL
BEGIN
    IF p_dob IS NULL THEN
        RETURN NULL;
    END IF;
    RETURN TIMESTAMPDIFF(YEAR, p_dob, CURDATE());
END //

-- ----------------------------------------------------------------------------
-- 3. STORED PROCEDURE: sp_get_open_schemes
-- Returns all published schemes that are currently 'Open' for applications.
-- Supports optional category and state filtering.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_open_schemes;

CREATE PROCEDURE sp_get_open_schemes(
    IN p_category_id INT,
    IN p_state VARCHAR(100)
)
BEGIN
    SELECT
        scheme_id,
        scheme_name,
        short_description,
        category_name,
        applicable_scope,
        applicable_state,
        start_date,
        end_date,
        official_application_url,
        days_remaining
    FROM v_published_schemes
    WHERE application_status = 'Open'
      AND (p_category_id IS NULL OR p_category_id = 0 OR category_id = p_category_id)
      AND (p_state IS NULL OR p_state = '' OR applicable_scope = 'National' OR applicable_state = p_state)
    ORDER BY scheme_name ASC;
END //

-- ----------------------------------------------------------------------------
-- 4. STORED PROCEDURE: sp_get_scheme_details
-- Retrieves comprehensive scheme information along with aggregate counts
-- of associated eligibility criteria and required documents.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_scheme_details;

CREATE PROCEDURE sp_get_scheme_details(
    IN p_scheme_id INT
)
BEGIN
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
        fn_calculate_scheme_status(s.publication_status, s.start_date, s.end_date) AS application_status,
        (SELECT COUNT(*) FROM eligibility_criteria ec WHERE ec.scheme_id = s.scheme_id) AS criteria_count,
        (SELECT COUNT(*) FROM required_documents rd WHERE rd.scheme_id = s.scheme_id) AS documents_count,
        a.full_name AS created_by_admin_name,
        s.created_at,
        s.updated_at
    FROM schemes s
    INNER JOIN categories c ON s.category_id = c.category_id
    LEFT JOIN admins a ON s.created_by_admin_id = a.admin_id
    WHERE s.scheme_id = p_scheme_id;
END //

-- ----------------------------------------------------------------------------
-- 5. STORED PROCEDURE: sp_get_category_summary
-- Provides category-level metrics from the summary view.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_get_category_summary;

CREATE PROCEDURE sp_get_category_summary()
BEGIN
    SELECT
        category_id,
        category_name,
        category_description,
        total_schemes,
        published_schemes,
        open_schemes,
        upcoming_schemes,
        closed_schemes
    FROM v_scheme_category_summary
    ORDER BY total_schemes DESC, category_name ASC;
END //

-- ----------------------------------------------------------------------------
-- 6. STORED PROCEDURE: sp_add_scheme
-- Demonstrates Transaction Control (START TRANSACTION, COMMIT, ROLLBACK),
-- exception handling (SQLEXCEPTION handler), validation, and audit entry.
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS sp_add_scheme;

CREATE PROCEDURE sp_add_scheme(
    IN p_scheme_name VARCHAR(200),
    IN p_short_desc VARCHAR(500),
    IN p_desc TEXT,
    IN p_benefits TEXT,
    IN p_category_id INT,
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_scope VARCHAR(50),
    IN p_state VARCHAR(100),
    IN p_app_url VARCHAR(500),
    IN p_source_url VARCHAR(500),
    IN p_pub_status ENUM('draft', 'published', 'unpublished'),
    IN p_admin_id INT,
    OUT p_new_scheme_id INT,
    OUT p_status_code INT,
    OUT p_status_message VARCHAR(255)
)
proc_block: BEGIN
    DECLARE v_category_exists INT DEFAULT 0;

    -- Error handler to automatically rollback in case of any SQL error
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_new_scheme_id = NULL;
        SET p_status_code = 500;
        SET p_status_message = 'Database error occurred during scheme creation. Transaction rolled back.';
    END;

    -- Validation 1: Verify category exists
    SELECT COUNT(*) INTO v_category_exists FROM categories WHERE category_id = p_category_id;
    IF v_category_exists = 0 THEN
        SET p_new_scheme_id = NULL;
        SET p_status_code = 400;
        SET p_status_message = 'Invalid Category ID provided.';
        LEAVE proc_block;
    END IF;

    -- Validation 2: Ensure end_date >= start_date if provided
    IF p_end_date IS NOT NULL AND p_end_date < p_start_date THEN
        SET p_new_scheme_id = NULL;
        SET p_status_code = 400;
        SET p_status_message = 'Closing date cannot be earlier than opening date.';
        LEAVE proc_block;
    END IF;

    -- Begin atomic transaction
    START TRANSACTION;

    INSERT INTO schemes (
        scheme_name, short_description, description, benefits,
        category_id, start_date, end_date, applicable_scope, applicable_state,
        official_application_url, official_source_url, source_last_verified_at,
        publication_status, created_by_admin_id
    ) VALUES (
        p_scheme_name, p_short_desc, p_desc, p_benefits,
        p_category_id, p_start_date, p_end_date, p_scope, p_state,
        p_app_url, p_source_url, CURDATE(),
        p_pub_status, p_admin_id
    );

    SET p_new_scheme_id = LAST_INSERT_ID();

    -- Insert into scheme_audit_log as part of same transaction
    INSERT INTO scheme_audit_log (admin_id, scheme_id, action_type, description)
    VALUES (
        p_admin_id,
        p_new_scheme_id,
        'SCHEME_CREATED',
        CONCAT('Scheme "', p_scheme_name, '" created via stored procedure sp_add_scheme.')
    );

    COMMIT;

    SET p_status_code = 201;
    SET p_status_message = 'Scheme created successfully with audit logging.';
END //

DELIMITER ;

SELECT 'Stored procedures and functions defined successfully!' AS status_message;
