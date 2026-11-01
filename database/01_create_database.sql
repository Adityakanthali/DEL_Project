-- ============================================================================
-- SCRIPT 01: CREATE DATABASE AND SET CHARACTER SET
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7 compatible (InnoDB, utf8mb4)
-- Description: Creates the database if not exists and sets encoding.
-- ============================================================================

-- Drop existing database only if resetting environment
DROP DATABASE IF EXISTS government_scheme_db;

-- Create database with full Unicode support (supports emoji, multilingual text)
CREATE DATABASE government_scheme_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Select database for subsequent operations
USE government_scheme_db;

SELECT 'Database government_scheme_db created successfully!' AS status_message;
