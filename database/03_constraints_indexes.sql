-- ============================================================================
-- SCRIPT 03: CONSTRAINTS AND INDEXES
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7 (InnoDB)
-- Description: Enforces entity integrity, domain constraints, check constraints,
--              referential integrity, and query performance indexes.
-- ============================================================================

USE government_scheme_db;

-- ----------------------------------------------------------------------------
-- 1. DOMAIN & CHECK CONSTRAINTS
-- Validates data ranges and allowable values directly at the database engine level.
-- ----------------------------------------------------------------------------

-- Check: Annual income cannot be negative
ALTER TABLE users
    ADD CONSTRAINT chk_user_income
    CHECK (annual_income IS NULL OR annual_income >= 0);

-- Check: Scheme end_date must be on or after start_date (if end_date is specified)
ALTER TABLE schemes
    ADD CONSTRAINT chk_scheme_dates
    CHECK (end_date IS NULL OR end_date >= start_date);

-- Check: Only allowed comparison operators for eligibility criteria
ALTER TABLE eligibility_criteria
    ADD CONSTRAINT chk_criteria_operator
    CHECK (operator IN ('>=', '<=', '=', '>', '<'));

-- Check: Allowable geographic scopes
ALTER TABLE schemes
    ADD CONSTRAINT chk_scheme_scope
    CHECK (applicable_scope IN ('National', 'State', 'Regional'));

-- ----------------------------------------------------------------------------
-- 2. PERFORMANCE & COVERING INDEXES
-- Optimizes common lookup queries, filters, joins, and sorting operations.
-- ----------------------------------------------------------------------------

-- Composite index for citizen scheme discovery by Category and Publication Status
CREATE INDEX idx_schemes_pub_cat
    ON schemes (publication_status, category_id);

-- Composite index for date-based application status filtering (Open, Upcoming, Closed)
CREATE INDEX idx_schemes_pub_dates
    ON schemes (publication_status, start_date, end_date);

-- Composite index for state-specific and national schemes
CREATE INDEX idx_schemes_scope_filter
    ON schemes (publication_status, applicable_scope, applicable_state);

-- Index for searching criteria by scheme and type
CREATE INDEX idx_criteria_eval
    ON eligibility_criteria (scheme_id, criterion_type, is_mandatory);

-- Index on audit log for quick chronological review in admin panel
CREATE INDEX idx_audit_recent
    ON scheme_audit_log (changed_at DESC);

SELECT 'Constraints and indexes applied successfully!' AS status_message;
