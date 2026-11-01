-- ============================================================================
-- SCRIPT 04: SAMPLE DATA INSERTION (SEEDS)
-- Project: Government Scheme Management and Eligibility Recommendation System
-- DBMS: MySQL 8.0+ / 5.7
-- Description: Realistic, educational sample data covering categories, schemes,
--              eligibility criteria, required documents, users, bookmarks, and audit.
-- Note: Password hash corresponds to 'Admin@123' and 'Citizen@123'
-- ============================================================================

USE government_scheme_db;

-- ----------------------------------------------------------------------------
-- 1. ADMIN USERS SEED
-- Default admin credentials for testing:
-- Email: admin@govscheme.in | Password: Admin@123
-- ----------------------------------------------------------------------------
INSERT INTO admins (admin_id, full_name, email, password_hash, role, is_active)
VALUES
(1, 'System Administrator', 'admin@govscheme.in', '$2a$10$6C0rZqL2P2c3cK2x6x.D/OBuO3mH2qF3hF7eXv1L9bT.aW7v9uY9y', 'superadmin', 1),
(2, 'Scheme Officer Sharma', 'officer.sharma@govscheme.in', '$2a$10$6C0rZqL2P2c3cK2x6x.D/OBuO3mH2qF3hF7eXv1L9bT.aW7v9uY9y', 'admin', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- ----------------------------------------------------------------------------
-- 2. CATEGORIES SEED (8 Diverse Domains)
-- ----------------------------------------------------------------------------
INSERT INTO categories (category_id, category_name, description) VALUES
(1, 'Agriculture & Farmers Welfare', 'Initiatives, credit facilities, input subsidies, and crop insurance for farmers and agricultural laborers.'),
(2, 'Education & Scholarships', 'Pre-matric and post-matric financial support, merit scholarships, and coaching assistance for students.'),
(3, 'Healthcare & Wellness', 'Comprehensive medical insurance, tertiary hospitalization coverage, and maternity benefits.'),
(4, 'Employment & Skill Development', 'Vocational skill training, apprenticeships, wage employment, and job placement assistance.'),
(5, 'Housing & Urban Development', 'Affordable pucca housing assistance, urban sanitation, and interest subsidy for rural and urban citizens.'),
(6, 'Women & Child Development', 'Empowerment programs, nutrition support, girl child education grants, and maternity cash incentives.'),
(7, 'Social Welfare & Senior Citizens', 'Old age pensions, disability pensions, widow support, and social safety nets for vulnerable groups.'),
(8, 'Business & MSME Support', 'Collateral-free credit, capital subsidy, technology upgrades, and incubation support for micro & small enterprises.')
ON DUPLICATE KEY UPDATE category_name=VALUES(category_name);

-- ----------------------------------------------------------------------------
-- 3. CITIZEN USERS SEED (4 Realistic Profiles)
-- Password for all demo citizens: Citizen@123
-- ----------------------------------------------------------------------------
INSERT INTO users (user_id, full_name, email, password_hash, date_of_birth, state, district, occupation, annual_income, education_level, beneficiary_group, is_active) VALUES
(1, 'Rahul Sharma', 'rahul.sharma@example.com', '$2a$10$w0M89qRrv8dkl16x09yE/u3kO42oQp0u8eH892sB4fU0bYvCq2W3e', '1992-05-15', 'Maharashtra', 'Pune', 'Farmer', 180000.00, 'Graduate', 'General', 1),
(2, 'Priya Patel', 'priya.patel@example.com', '$2a$10$w0M89qRrv8dkl16x09yE/u3kO42oQp0u8eH892sB4fU0bYvCq2W3e', '2004-08-20', 'Gujarat', 'Ahmedabad', 'Student', 120000.00, 'Undergraduate', 'OBC', 1),
(3, 'Anita Deshmukh', 'anita.deshmukh@example.com', '$2a$10$w0M89qRrv8dkl16x09yE/u3kO42oQp0u8eH892sB4fU0bYvCq2W3e', '1988-11-10', 'Maharashtra', 'Nagpur', 'Self-Employed', 240000.00, '12th Pass', 'Women Entrepreneur', 1),
(4, 'Vikram Singh', 'vikram.singh@example.com', '$2a$10$w0M89qRrv8dkl16x09yE/u3kO42oQp0u8eH892sB4fU0bYvCq2W3e', '2001-03-25', 'Rajasthan', 'Jaipur', 'Unemployed Youth', 95000.00, 'Diploma', 'SC', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

-- ----------------------------------------------------------------------------
-- 4. SCHEMES SEED (15 Schemes: Open, Upcoming, Closed, Draft, National, State)
-- Current Year Reference: 2026
-- ----------------------------------------------------------------------------
INSERT INTO schemes (
    scheme_id, scheme_name, short_description, description, benefits,
    category_id, start_date, end_date, applicable_scope, applicable_state,
    official_application_url, official_source_url, source_last_verified_at,
    publication_status, created_by_admin_id
) VALUES
-- 1. PM-KISAN (Open, National)
(1, 'Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)',
    'Financial benefit of Rs. 6000 per year in three equal installments to all landholding farmer families.',
    'PM-KISAN is a central sector scheme to augment the financial needs of landholding farmers for procuring various inputs related to agriculture and domestic requirements.',
    'Direct Benefit Transfer (DBT) of Rs. 6,000 annually credited directly into bank accounts in three four-monthly periods of Rs. 2,000 each.',
    1, '2019-02-01', '2028-12-31', 'National', NULL,
    'https://pmkisan.gov.in', 'https://pmkisan.gov.in/AboutUs.aspx', '2026-01-15', 'published', 1),

-- 2. Ayushman Bharat PM-JAY (Open, National)
(2, 'Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana (PM-JAY)',
    'Health cover of up to Rs. 5 Lakh per family per year for secondary and tertiary care hospitalization.',
    'PM-JAY is the world largest government-funded healthcare program aiming to reduce catastrophic health expenditure for vulnerable families.',
    'Cashless and paperless access to healthcare services up to Rs. 5,00,000 per family per year at empaneled public and private hospitals across India.',
    3, '2018-09-23', '2029-12-31', 'National', NULL,
    'https://setu.pmjay.gov.in', 'https://pmjay.gov.in', '2026-02-01', 'published', 1),

-- 3. PM Awas Yojana - Urban (Open, National)
(3, 'Pradhan Mantri Awas Yojana - Urban (PMAY-U)',
    'Interest subsidy and pucca house construction assistance for economically weaker sections and lower income groups.',
    'PMAY-U addresses urban housing shortage among EWS/LIG and MIG categories by ensuring a pucca house to all eligible urban families with basic civic amenities.',
    'Upfront interest subsidy of up to 6.5% on housing loans up to Rs. 6,00,000, amounting to interest savings of approx Rs. 2.67 Lakh.',
    5, '2015-06-25', '2027-12-31', 'National', NULL,
    'https://pmaymis.gov.in', 'https://mohua.gov.in', '2026-01-20', 'published', 1),

-- 4. Post-Matric Scholarship for SC/ST Students (Open, National)
(4, 'Centrally Sponsored Post-Matric Scholarship for SC/ST Students',
    'Financial scholarship covering non-refundable fees and monthly maintenance allowances for higher education.',
    'Provides financial support to Scheduled Caste and Scheduled Tribe students studying at post-matriculation or post-secondary stages to enable them to complete education.',
    '100% reimbursement of approved non-refundable tuition fees plus maintenance allowance up to Rs. 13,500 per annum depending on course group.',
    2, '2020-04-01', '2027-03-31', 'National', NULL,
    'https://scholarships.gov.in', 'https://socialjustice.gov.in', '2026-02-10', 'published', 1),

-- 5. Prime Minister Employment Generation Programme (PMEGP) (Open, National)
(5, 'Prime Minister Employment Generation Programme (PMEGP)',
    'Credit-linked subsidy program for setting up new micro-enterprises in manufacturing and services sector.',
    'PMEGP aims to generate continuous and sustainable employment opportunities in rural and urban areas through financial assistance for new micro-enterprises.',
    'Government subsidy of 15% to 35% on project costs up to Rs. 50 Lakh for manufacturing and Rs. 20 Lakh for service sector projects.',
    8, '2008-08-15', '2028-03-31', 'National', NULL,
    'https://www.kviconline.gov.in/pmegp', 'https://msme.gov.in', '2026-01-10', 'published', 2),

-- 6. Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0) (Open, National)
(6, 'Pradhan Mantri Kaushal Vikas Yojana (PMKVY 4.0)',
    'Free industry-relevant skill training, assessment, and certification for unemployed youth.',
    'Flagship skill certification scheme of the Ministry of Skill Development and Entrepreneurship to enable youth to take up industry-relevant skill training.',
    'Free training, stipend for transport/lodging where applicable, Skill India certification, and job placement assistance.',
    4, '2023-01-26', '2027-06-30', 'National', NULL,
    'https://www.skillindia.gov.in', 'https://www.msde.gov.in', '2026-02-15', 'published', 2),

-- 7. Atal Pension Yojana (APY) (Open, National)
(7, 'Atal Pension Yojana (APY)',
    'Guaranteed monthly pension of Rs. 1000 to Rs. 5000 from age 60 based on modest contribution.',
    'Periodic pension scheme targeted at all citizens in the unorganized sector to build a retirement security corpus.',
    'Guaranteed minimum monthly pension of Rs. 1,000, 2,000, 3,000, 4,000, or 5,000 to the subscriber for life after attaining 60 years of age.',
    7, '2015-05-09', '2030-12-31', 'National', NULL,
    'https://www.npscra.nsdl.co.in', 'https://financialservices.gov.in', '2026-01-05', 'published', 1),

-- 8. Stand-Up India Scheme (Open, National)
(8, 'Stand-Up India Scheme for Women and SC/ST Entrepreneurs',
    'Bank loans between Rs. 10 Lakh and Rs. 1 Crore for setting up a greenfield enterprise in manufacturing, services, or trading.',
    'Promotes entrepreneurship among women and SC/ST communities to participate in economic growth and job creation.',
    'Composite loan (term loan and working capital) between Rs. 10 Lakh and Rs. 100 Lakh with concessional margin money.',
    8, '2016-04-05', '2027-03-31', 'National', NULL,
    'https://www.standupmitra.in', 'https://www.standupmitra.in/Home/SUISchemes', '2026-01-25', 'published', 2),

-- 9. Ladli Behna Yojana (Open, State - Madhya Pradesh)
(9, 'Mukhyamantri Ladli Behna Yojana',
    'Direct monthly financial transfer of Rs. 1,250 to married women of Madhya Pradesh to foster economic independence.',
    'State welfare initiative by the Government of Madhya Pradesh to improve maternal health, nutrition, and financial autonomy of women.',
    'Direct benefit transfer of Rs. 1,250 per month into Aadhaar-linked bank accounts.',
    6, '2023-03-15', '2028-12-31', 'State', 'Madhya Pradesh',
    'https://cmladlibehna.mp.gov.in', 'https://mp.gov.in', '2026-02-18', 'published', 1),

-- 10. MahaDBT Post-Matric Tuition Fee Scheme (Open, State - Maharashtra)
(10, 'Maharashtra Post-Matric Tuition & Examination Fee Assistance',
    'Reimbursement of tuition fees and exam fees for eligible OBC/SEBC/EBC students in Maharashtra.',
    'Assists economically backward and reserved category students of Maharashtra pursuing higher professional and technical courses.',
    '50% to 100% waiver/reimbursement of approved government college and private college tuition fees.',
    2, '2021-08-01', '2027-07-31', 'State', 'Maharashtra',
    'https://mahadbt.maharashtra.gov.in', 'https://sjsa.maharashtra.gov.in', '2026-02-05', 'published', 1),

-- 11. PM Kisan Maan-Dhan Yojana (Open, National)
(11, 'Pradhan Mantri Kisan Maan-Dhan Yojana (PM-KMY)',
    'Old age pension scheme for small and marginal farmers providing Rs. 3,000 monthly pension upon reaching 60 years.',
    'Voluntary and contributory pension scheme for landholder farmers owning up to 2 hectares of cultivable land.',
    'Assured monthly pension of Rs. 3,000 post 60 years, with equal 50% contribution matching from Central Government.',
    1, '2019-09-12', '2029-12-31', 'National', NULL,
    'https://maandhan.in', 'https://pmkisan.gov.in', '2026-01-12', 'published', 2),

-- 12. National Apprenticeship Promotion Scheme (NAPS) (Open, National)
(12, 'National Apprenticeship Promotion Scheme (NAPS-2)',
    'Financial incentives to industrial establishments and stipends for registered apprentices.',
    'Promotes apprenticeship training across Indian industries by sharing 25% of prescribed stipend directly to apprentices.',
    'Direct transfer of 25% stipend up to Rs. 1,500 per month directly to apprentice bank account plus on-the-job industrial experience.',
    4, '2016-08-19', '2028-03-31', 'National', NULL,
    'https://www.apprenticeshipindia.gov.in', 'https://www.msde.gov.in', '2026-01-18', 'published', 2),

-- 13. National Means-cum-Merit Scholarship (Upcoming Demo Scheme)
(13, 'National Means-cum-Merit Scholarship Scheme (Upcoming Cycle)',
    'Merit scholarship of Rs. 12,000 per year for meritorious students of economically weaker sections from Class IX to XII.',
    'Aims to arrest drop out of meritorious students at class VIII and encourage them to continue secondary stage education.',
    'Scholarship grant of Rs. 1,000 per month (Rs. 12,000 per annum) credited via Public Financial Management System (PFMS).',
    2, '2026-11-01', '2027-04-30', 'National', NULL,
    'https://scholarships.gov.in', 'https://dsel.education.gov.in', '2026-02-20', 'published', 1),

-- 14. National Solar Rooftop Subsidy Phase-II (Closed Demo Scheme)
(14, 'National Solar Rooftop Subsidy Phase-II (2024 Window)',
    'Closed application cycle: Financial assistance for residential rooftop solar plant installation.',
    'Provided capital subsidy up to 40% for installing rooftop solar PV systems in residential properties during the 2024 application window.',
    'Direct DBT subsidy of Rs. 14,588 per kW up to 3 kW capacity.',
    5, '2024-01-01', '2024-12-31', 'National', NULL,
    'https://solarrooftop.gov.in', 'https://mnre.gov.in', '2025-01-10', 'published', 1),

-- 15. Green Mobility EV Incentive Programme (Draft Demo Scheme - Admin Only)
(15, 'National Green Mobility Electric Vehicle Subsidy (Internal Draft)',
    'Proposed grant incentive for delivery workers and youth purchasing two-wheeler commercial EVs.',
    'Internal draft scheme pending inter-ministerial budgetary approval. Intended to subsidize EV purchases for young delivery partners.',
    'Direct subsidy of Rs. 15,000 or 15% of battery cost for commercial two-wheelers.',
    8, '2027-01-01', '2029-12-31', 'National', NULL,
    NULL, 'https://heavyindustries.gov.in', '2026-02-01', 'draft', 1)
ON DUPLICATE KEY UPDATE scheme_name=VALUES(scheme_name);

-- ----------------------------------------------------------------------------
-- 5. ELIGIBILITY CRITERIA SEED
-- Operators: >=, <=, =, >, <
-- Types: min_age, max_age, min_income, max_income, occupation, state, education_level, beneficiary_group
-- ----------------------------------------------------------------------------
INSERT INTO eligibility_criteria (scheme_id, criterion_type, operator, criterion_value, is_mandatory, description) VALUES
-- PM-KISAN (Scheme 1)
(1, 'occupation', '=', 'Farmer', 1, 'Applicant must be an active landholding farmer'),
(1, 'min_age', '>=', '18', 1, 'Applicant must be at least 18 years of age'),
(1, 'max_income', '<=', '300000', 0, 'Recommended for non-institutional small & marginal farm families'),

-- Ayushman Bharat PM-JAY (Scheme 2)
(2, 'max_income', '<=', '250000', 1, 'Annual family income must not exceed Rs. 2,50,000'),
(2, 'min_age', '>=', '18', 1, 'Head of household or applicant must be 18 years or older'),

-- PM Awas Yojana (Scheme 3)
(3, 'max_income', '<=', '600000', 1, 'Annual household income must be within EWS/LIG bracket (up to Rs. 6,00,000)'),
(3, 'min_age', '>=', '21', 1, 'Applicant must be at least 21 years old'),

-- Post-Matric Scholarship SC/ST (Scheme 4)
(4, 'beneficiary_group', '=', 'SC', 1, 'Applicant must belong to Scheduled Caste (SC) or Scheduled Tribe (ST) category'),
(4, 'max_income', '<=', '250000', 1, 'Total family income from all sources must not exceed Rs. 2,50,000 per annum'),
(4, 'min_age', '>=', '16', 1, 'Minimum age is 16 years for post-matric higher education'),

-- PMEGP (Scheme 5)
(5, 'min_age', '>=', '18', 1, 'Applicant must be at least 18 years of age'),
(5, 'education_level', '=', '8th Pass', 1, 'Must have passed at least 8th standard for manufacturing projects over Rs. 10 Lakh'),

-- PMKVY 4.0 (Scheme 6)
(6, 'min_age', '>=', '15', 1, 'Minimum age is 15 years'),
(6, 'max_age', '<=', '45', 1, 'Maximum age limit is 45 years'),
(6, 'occupation', '=', 'Unemployed Youth', 0, 'Targeted primarily at unemployed youth and school dropouts'),

-- Atal Pension Yojana (Scheme 7)
(7, 'min_age', '>=', '18', 1, 'Entry age must be at least 18 years'),
(7, 'max_age', '<=', '40', 1, 'Maximum entry age is 40 years to accumulate pension corpus'),

-- Stand-Up India (Scheme 8)
(8, 'min_age', '>=', '18', 1, 'Applicant entrepreneur must be at least 18 years old'),
(8, 'beneficiary_group', '=', 'Women Entrepreneur', 1, 'Must be a woman entrepreneur or belong to SC/ST category'),

-- Ladli Behna Yojana (Scheme 9)
(9, 'state', '=', 'Madhya Pradesh', 1, 'Applicant must be a permanent resident of Madhya Pradesh'),
(9, 'min_age', '>=', '21', 1, 'Applicant must be a woman aged 21 years or above'),
(9, 'max_age', '<=', '60', 1, 'Applicant must be below 60 years of age'),
(9, 'max_income', '<=', '250000', 1, 'Annual family income must not exceed Rs. 2,50,000'),

-- MahaDBT Tuition Fee (Scheme 10)
(10, 'state', '=', 'Maharashtra', 1, 'Applicant must be a domicile of Maharashtra state'),
(10, 'max_income', '<=', '800000', 1, 'Annual family income should be less than or equal to Rs. 8,00,000'),
(10, 'min_age', '>=', '17', 1, 'Applicant must be at least 17 years old pursuing higher education'),

-- PM-KMY (Scheme 11)
(11, 'occupation', '=', 'Farmer', 1, 'Applicant must be a small or marginal farmer'),
(11, 'min_age', '>=', '18', 1, 'Minimum entry age is 18 years'),
(11, 'max_age', '<=', '40', 1, 'Maximum entry age is 40 years'),

-- NAPS-2 (Scheme 12)
(12, 'min_age', '>=', '14', 1, 'Minimum age is 14 years (18 for hazardous occupations)'),
(12, 'education_level', '=', 'Diploma', 0, 'Open to ITI, Diploma, and Graduate apprentice aspirants')
ON DUPLICATE KEY UPDATE description=VALUES(description);

-- ----------------------------------------------------------------------------
-- 6. REQUIRED DOCUMENTS SEED
-- ----------------------------------------------------------------------------
INSERT INTO required_documents (scheme_id, document_name, description, is_mandatory) VALUES
-- PM-KISAN
(1, 'Aadhaar Card', 'UIDAI Aadhaar card of the landholder for identity verification', 1),
(1, 'Land Ownership Record (7/12 Extract / Khasra)', 'Official revenue record confirming cultivable land ownership', 1),
(1, 'Bank Passbook / Cancelled Cheque', 'Bank account linked with Aadhaar for Direct Benefit Transfer', 1),

-- Ayushman Bharat PM-JAY
(2, 'Aadhaar Card or Ration Card', 'Proof of identity and family linkage under SECC database', 1),
(2, 'Income Certificate', 'Authorized income certificate issued by competent revenue authority', 1),

-- PM Awas Yojana
(3, 'Aadhaar Card', 'Identity card for all adult family members', 1),
(3, 'Income Proof / Salary Slip / ITR', 'Proof of household annual income within EWS/LIG bracket', 1),
(3, 'Affidavit of No Pucca House', 'Notarized undertaking confirming family owns no pucca house in India', 1),

-- Post-Matric SC/ST Scholarship
(4, 'Caste Certificate', 'Caste validation certificate issued by competent state authority', 1),
(4, 'Previous Year Marksheet', 'Passing marksheet of qualifying examination', 1),
(4, 'Current Fee Receipt / College ID', 'Proof of active enrollment in recognized post-matric course', 1),
(4, 'Income Certificate', 'Income certificate of parents/guardians for current financial year', 1),

-- PMEGP
(5, 'Detailed Project Report (DPR)', 'Bankable project report outlining business model and capital expenditure', 1),
(5, 'Education Certificate', '8th standard or higher qualification passing certificate', 1),
(5, 'Special Category / Rural Certificate', 'Proof for claiming higher capital subsidy if applicable', 0),

-- Ladli Behna Yojana
(9, 'Samagra Family ID', 'Madhya Pradesh Samagra Family & Member Portal ID', 1),
(9, 'Aadhaar Card', 'Aadhaar card with active mobile number linked', 1),
(9, 'DBT-enabled Bank Account Details', 'Active single bank account with DBT mapping enabled', 1)
ON DUPLICATE KEY UPDATE document_name=VALUES(document_name);

-- ----------------------------------------------------------------------------
-- 7. USER SAVED SCHEMES (BOOKMARKS) SEED
-- ----------------------------------------------------------------------------
INSERT INTO user_saved_schemes (user_id, scheme_id, saved_at) VALUES
(1, 1, '2026-02-01 10:30:00'), -- Rahul saved PM-KISAN
(1, 11, '2026-02-05 14:15:00'), -- Rahul saved PM-KMY
(2, 4, '2026-02-10 11:00:00'), -- Priya saved Post-Matric Scholarship
(2, 10, '2026-02-12 16:45:00'), -- Priya saved MahaDBT
(3, 8, '2026-02-15 09:20:00'), -- Anita saved Stand-Up India
(4, 6, '2026-02-18 13:10:00')  -- Vikram saved PMKVY
ON DUPLICATE KEY UPDATE saved_at=VALUES(saved_at);

-- ----------------------------------------------------------------------------
-- 8. SCHEME AUDIT LOG INITIAL SEED
-- ----------------------------------------------------------------------------
INSERT INTO scheme_audit_log (admin_id, scheme_id, action_type, description, changed_at) VALUES
(1, 1, 'SCHEME_CREATED', 'Initial onboarding and publication of PM-KISAN scheme record.', '2026-01-15 09:00:00'),
(1, 2, 'SCHEME_CREATED', 'Onboarded Ayushman Bharat PM-JAY scheme record with tertiary benefits.', '2026-01-16 10:30:00'),
(2, 5, 'SCHEME_CREATED', 'Published Prime Minister Employment Generation Programme (PMEGP).', '2026-01-20 14:00:00'),
(1, 13, 'SCHEME_CREATED', 'Added upcoming cycle for National Means-cum-Merit Scholarship.', '2026-02-01 11:45:00'),
(1, 15, 'SCHEME_CREATED', 'Created draft record for Green Mobility EV Incentive Programme.', '2026-02-10 16:20:00')
ON DUPLICATE KEY UPDATE action_type=VALUES(action_type);

SELECT 'Sample data inserted successfully (8 categories, 15 schemes, criteria, documents, demo users)!' AS status_message;
