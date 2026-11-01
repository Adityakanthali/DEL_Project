-- ============================================================================
-- SCRIPT 02: CREATE RELATIONAL TABLES
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7 (InnoDB Storage Engine)
-- Normalization: Normalized up to 3NF (Third Normal Form)
-- ============================================================================

USE government_scheme_db;

-- Disable foreign key checks during batch table recreation
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS scheme_audit_log;
DROP TABLE IF EXISTS user_saved_schemes;
DROP TABLE IF EXISTS required_documents;
DROP TABLE IF EXISTS eligibility_criteria;
DROP TABLE IF EXISTS schemes;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS admins;

SET FOREIGN_KEY_CHECKS = 1;

-- ----------------------------------------------------------------------------
-- TABLE 1: admins
-- Stores administrative user credentials and roles.
-- Public users cannot self-register as administrators.
-- ----------------------------------------------------------------------------
CREATE TABLE admins (
    admin_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_admin_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 2: users (Citizens)
-- Stores registered citizen profiles for scheme bookmarking and automated
-- preliminary eligibility matching. No Aadhaar/bank numbers are collected.
-- ----------------------------------------------------------------------------
CREATE TABLE users (
    user_id INT AUTO_INCREMENT PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    date_of_birth DATE NULL,
    state VARCHAR(100) NULL,
    district VARCHAR(100) NULL,
    occupation VARCHAR(100) NULL,
    annual_income DECIMAL(12,2) NULL,
    education_level VARCHAR(100) NULL,
    beneficiary_group VARCHAR(100) NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_email (email),
    INDEX idx_user_state_occ (state, occupation)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 3: categories
-- Look-up table for scheme domains (Education, Agriculture, Health, etc.).
-- Avoids transitive dependencies in schemes (3NF).
-- ----------------------------------------------------------------------------
CREATE TABLE categories (
    category_id INT AUTO_INCREMENT PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_category_name (category_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 4: schemes
-- Central entity storing scheme metadata, descriptions, benefits, and dates.
-- ----------------------------------------------------------------------------
CREATE TABLE schemes (
    scheme_id INT AUTO_INCREMENT PRIMARY KEY,
    scheme_name VARCHAR(200) NOT NULL,
    short_description VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    category_id INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NULL,
    applicable_scope VARCHAR(50) NOT NULL DEFAULT 'National',
    applicable_state VARCHAR(100) NULL,
    official_application_url VARCHAR(500) NULL,
    official_source_url VARCHAR(500) NULL,
    source_last_verified_at DATE NULL,
    publication_status ENUM('draft', 'published', 'unpublished') NOT NULL DEFAULT 'draft',
    created_by_admin_id INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_schemes_category FOREIGN KEY (category_id)
        REFERENCES categories(category_id)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    CONSTRAINT fk_schemes_admin FOREIGN KEY (created_by_admin_id)
        REFERENCES admins(admin_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_schemes_category (category_id),
    INDEX idx_schemes_status (publication_status),
    INDEX idx_schemes_dates (start_date, end_date),
    INDEX idx_schemes_scope_state (applicable_scope, applicable_state)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 5: eligibility_criteria
-- Atomic criteria records associated with schemes (1NF & 3NF).
-- Operators allowlist: '>=', '<=', '=', '>', '<'
-- ----------------------------------------------------------------------------
CREATE TABLE eligibility_criteria (
    criterion_id INT AUTO_INCREMENT PRIMARY KEY,
    scheme_id INT NOT NULL,
    criterion_type VARCHAR(50) NOT NULL,
    operator VARCHAR(10) NOT NULL,
    criterion_value VARCHAR(100) NOT NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    description VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_criteria_scheme FOREIGN KEY (scheme_id)
        REFERENCES schemes(scheme_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_criteria_scheme (scheme_id),
    INDEX idx_criteria_type (criterion_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 6: required_documents
-- List of supporting documents needed to apply for a scheme.
-- ----------------------------------------------------------------------------
CREATE TABLE required_documents (
    document_id INT AUTO_INCREMENT PRIMARY KEY,
    scheme_id INT NOT NULL,
    document_name VARCHAR(150) NOT NULL,
    description VARCHAR(255) NULL,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_documents_scheme FOREIGN KEY (scheme_id)
        REFERENCES schemes(scheme_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_documents_scheme (scheme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 7: user_saved_schemes
-- Many-to-Many junction table linking users to bookmarked schemes.
-- Uses composite primary key (user_id, scheme_id).
-- ----------------------------------------------------------------------------
CREATE TABLE user_saved_schemes (
    user_id INT NOT NULL,
    scheme_id INT NOT NULL,
    saved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, scheme_id),
    CONSTRAINT fk_saved_user FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_saved_scheme FOREIGN KEY (scheme_id)
        REFERENCES schemes(scheme_id)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    INDEX idx_saved_scheme (scheme_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------------------------
-- TABLE 8: scheme_audit_log
-- Audit log tracking administrative actions (Creation, Updates, Deletions).
-- Preserves historical records even if a scheme or admin is deleted (ON DELETE SET NULL).
-- ----------------------------------------------------------------------------
CREATE TABLE scheme_audit_log (
    audit_id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NULL,
    scheme_id INT NULL,
    action_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_audit_admin FOREIGN KEY (admin_id)
        REFERENCES admins(admin_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    CONSTRAINT fk_audit_scheme FOREIGN KEY (scheme_id)
        REFERENCES schemes(scheme_id)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    INDEX idx_audit_action (action_type),
    INDEX idx_audit_time (changed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SELECT 'All 8 relational tables created successfully!' AS status_message;
