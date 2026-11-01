-- ============================================================================
-- SCRIPT 07: CURSOR DEMONSTRATION
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7
-- Concept: Demonstrates SQL Cursor programming in MySQL stored procedures:
--          1. Cursor Declaration
--          2. Variable & NOT FOUND Handler Declaration
--          3. Cursor OPEN
--          4. FETCH Loop with Condition Check
--          5. Record-by-record business calculation
--          6. Cursor CLOSE
--          7. Observable Tabular Output
-- ============================================================================

USE government_scheme_db;

DROP PROCEDURE IF EXISTS sp_generate_scheme_status_report;

DELIMITER //

CREATE PROCEDURE sp_generate_scheme_status_report()
BEGIN
    -- Step 1: Declare iteration variables
    DECLARE v_done INT DEFAULT 0;
    DECLARE v_scheme_id INT;
    DECLARE v_scheme_name VARCHAR(200);
    DECLARE v_category_id INT;
    DECLARE v_category_name VARCHAR(100);
    DECLARE v_start_date DATE;
    DECLARE v_end_date DATE;
    DECLARE v_pub_status VARCHAR(20);
    DECLARE v_calc_status VARCHAR(20);
    DECLARE v_criteria_count INT;
    DECLARE v_doc_count INT;
    DECLARE v_days_remaining INT;

    -- Step 2: Declare CURSOR to iterate over all active schemes
    DECLARE cur_schemes CURSOR FOR
        SELECT
            s.scheme_id,
            s.scheme_name,
            s.category_id,
            c.category_name,
            s.start_date,
            s.end_date,
            s.publication_status
        FROM schemes s
        INNER JOIN categories c ON s.category_id = c.category_id
        ORDER BY s.scheme_id ASC;

    -- Step 3: Declare NOT FOUND handler to terminate the fetch loop gracefully
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    -- Step 4: Create temporary table to accumulate processed cursor rows
    DROP TEMPORARY TABLE IF EXISTS temp_scheme_report;
    CREATE TEMPORARY TABLE temp_scheme_report (
        report_id INT AUTO_INCREMENT PRIMARY KEY,
        scheme_id INT,
        scheme_name VARCHAR(200),
        category_name VARCHAR(100),
        publication_status VARCHAR(20),
        calculated_status VARCHAR(20),
        criteria_configured INT,
        documents_required INT,
        timeline_notes VARCHAR(150)
    );

    -- Step 5: Open Cursor
    OPEN cur_schemes;

    -- Step 6: Loop through the result set
    fetch_loop: LOOP
        FETCH cur_schemes INTO
            v_scheme_id,
            v_scheme_name,
            v_category_id,
            v_category_name,
            v_start_date,
            v_end_date,
            v_pub_status;

        -- Check loop exit condition
        IF v_done = 1 THEN
            LEAVE fetch_loop;
        END IF;

        -- Calculate business status using stored function
        SET v_calc_status = fn_calculate_scheme_status(v_pub_status, v_start_date, v_end_date);

        -- Query sub-records for criteria and required documents count
        SELECT COUNT(*) INTO v_criteria_count FROM eligibility_criteria WHERE scheme_id = v_scheme_id;
        SELECT COUNT(*) INTO v_doc_count FROM required_documents WHERE scheme_id = v_scheme_id;

        -- Format timeline note
        IF v_end_date IS NULL THEN
            SET v_days_remaining = NULL;
        ELSE
            SET v_days_remaining = DATEDIFF(v_end_date, CURDATE());
        END IF;

        -- Insert processed row into report table
        INSERT INTO temp_scheme_report (
            scheme_id, scheme_name, category_name, publication_status,
            calculated_status, criteria_configured, documents_required,
            timeline_notes
        ) VALUES (
            v_scheme_id,
            v_scheme_name,
            v_category_name,
            v_pub_status,
            v_calc_status,
            v_criteria_count,
            v_doc_count,
            CASE
                WHEN v_calc_status = 'Open' AND v_days_remaining IS NOT NULL
                    THEN CONCAT(v_days_remaining, ' days left until deadline')
                WHEN v_calc_status = 'Open' AND v_days_remaining IS NULL
                    THEN 'Open ongoing (no closing date specified)'
                WHEN v_calc_status = 'Upcoming'
                    THEN CONCAT('Starts on ', DATE_FORMAT(v_start_date, '%d-%b-%Y'))
                WHEN v_calc_status = 'Closed'
                    THEN CONCAT('Closed on ', DATE_FORMAT(v_end_date, '%d-%b-%Y'))
                ELSE 'Not published to public'
            END
        );
    END LOOP fetch_loop;

    -- Step 7: Close Cursor
    CLOSE cur_schemes;

    -- Step 8: Return observable output of the cursor execution
    SELECT
        scheme_id,
        scheme_name,
        category_name,
        publication_status,
        calculated_status,
        criteria_configured,
        documents_required,
        timeline_notes
    FROM temp_scheme_report
    ORDER BY scheme_id ASC;

    -- Clean up temporary storage
    DROP TEMPORARY TABLE IF EXISTS temp_scheme_report;

END //

DELIMITER ;

-- ============================================================================
-- DEMONSTRATION INVOCATION
-- Run this procedure in MySQL to view the cursor-generated status report:
-- ============================================================================
CALL sp_generate_scheme_status_report();
