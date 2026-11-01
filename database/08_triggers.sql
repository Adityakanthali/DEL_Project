-- ============================================================================
-- SCRIPT 08: TRIGGERS
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7
-- Concepts Demonstrated:
--   1. BEFORE INSERT: Integrity validation enforcing end_date >= start_date
--   2. BEFORE UPDATE: Integrity validation on date modifications
--   3. AFTER INSERT: Automated audit logging on new scheme creation
--   4. AFTER UPDATE: Automated change detection and audit logging
--   5. BEFORE DELETE: Preserves scheme name and details in audit log
-- ============================================================================

USE government_scheme_db;

DELIMITER //

-- ----------------------------------------------------------------------------
-- TRIGGER 1: trg_before_scheme_insert
-- Enforces domain logic: closing date cannot precede opening date.
-- Uses SIGNAL SQLSTATE '45000' to abort invalid transactions.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_before_scheme_insert //

CREATE TRIGGER trg_before_scheme_insert
BEFORE INSERT ON schemes
FOR EACH ROW
BEGIN
    IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Scheme closing date cannot precede opening date.';
    END IF;
END //

-- ----------------------------------------------------------------------------
-- TRIGGER 2: trg_before_scheme_update
-- Enforces date integrity during scheme modifications.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_before_scheme_update //

CREATE TRIGGER trg_before_scheme_update
BEFORE UPDATE ON schemes
FOR EACH ROW
BEGIN
    IF NEW.end_date IS NOT NULL AND NEW.end_date < NEW.start_date THEN
        SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Validation Error: Updated closing date cannot precede opening date.';
    END IF;
END //

-- ----------------------------------------------------------------------------
-- TRIGGER 3: trg_after_scheme_insert
-- Automatically logs scheme creation in scheme_audit_log table.
-- Captures creator admin ID, scheme ID, and initial status.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_scheme_insert //

CREATE TRIGGER trg_after_scheme_insert
AFTER INSERT ON schemes
FOR EACH ROW
BEGIN
    INSERT INTO scheme_audit_log (
        admin_id,
        scheme_id,
        action_type,
        description
    ) VALUES (
        NEW.created_by_admin_id,
        NEW.scheme_id,
        'SCHEME_CREATED',
        CONCAT('Scheme "', NEW.scheme_name, '" created with initial status "', NEW.publication_status, '".')
    );
END //

-- ----------------------------------------------------------------------------
-- TRIGGER 4: trg_after_scheme_update
-- Detects and logs changes to publication status, dates, or scheme metadata.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_after_scheme_update //

CREATE TRIGGER trg_after_scheme_update
AFTER UPDATE ON schemes
FOR EACH ROW
BEGIN
    DECLARE v_change_desc TEXT;

    -- If publication status changed (e.g., draft -> published, or published -> unpublished)
    IF OLD.publication_status <> NEW.publication_status THEN
        SET v_change_desc = CONCAT(
            'Publication status changed from "', OLD.publication_status,
            '" to "', NEW.publication_status, '" for scheme: ', NEW.scheme_name
        );

        INSERT INTO scheme_audit_log (admin_id, scheme_id, action_type, description)
        VALUES (NEW.created_by_admin_id, NEW.scheme_id, 'STATUS_CHANGED', v_change_desc);

    -- If name or descriptions changed
    ELSEIF OLD.scheme_name <> NEW.scheme_name OR OLD.short_description <> NEW.short_description THEN
        SET v_change_desc = CONCAT('Scheme details updated for: ', NEW.scheme_name);

        INSERT INTO scheme_audit_log (admin_id, scheme_id, action_type, description)
        VALUES (NEW.created_by_admin_id, NEW.scheme_id, 'SCHEME_UPDATED', v_change_desc);
    END IF;
END //

-- ----------------------------------------------------------------------------
-- TRIGGER 5: trg_before_scheme_delete
-- Preserves audit history before a scheme record is permanently deleted.
-- Because fk_audit_scheme has ON DELETE SET NULL, the audit_log entry will retain
-- the descriptive text and admin info even after the scheme record is removed.
-- ----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS trg_before_scheme_delete //

CREATE TRIGGER trg_before_scheme_delete
BEFORE DELETE ON schemes
FOR EACH ROW
BEGIN
    INSERT INTO scheme_audit_log (
        admin_id,
        scheme_id,
        action_type,
        description
    ) VALUES (
        OLD.created_by_admin_id,
        OLD.scheme_id,
        'SCHEME_DELETED',
        CONCAT('Scheme ID ', OLD.scheme_id, ' ("', OLD.scheme_name, '") was permanently deleted from the system.')
    );
END //

DELIMITER ;

SELECT 'Triggers (Date validation, Insert audit, Update audit, Delete audit) created successfully!' AS status_message;
