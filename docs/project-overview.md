# Project Overview: Government Scheme Management and Eligibility Recommendation System
**Academic Degree:** Bachelor of Engineering / Technology in Computer Engineering  
**Course:** Database Management Systems (DBMS) Mini-Project  
**Database:** MySQL 8.0+ (InnoDB Storage Engine)  
**Backend:** Node.js, Express.js (REST API Architecture)  
**Frontend:** HTML5, CSS3, Vanilla JavaScript (ES6 Modules)  

---

## 1. Abstract
The **Government Scheme Management and Eligibility Recommendation System** is a full-stack, database-driven web application designed to solve the critical information asymmetry citizens face when attempting to discover and evaluate their eligibility for government welfare programs. While state and central governments launch hundreds of social security, educational, agricultural, and financial schemes, citizen awareness remains severely fragmented across disparate portals with convoluted eligibility conditions.

This system provides a centralized platform where citizens can search, filter, and preliminarily assess their eligibility through a transparent rule-evaluation engine based on their age, occupation, income, state, and educational qualifications. Concurrently, authorized administrators maintain verified scheme catalogs, manage domain categories, configure eligibility parameters, and track system changes through an audit trail. 

From an academic DBMS perspective, the project demonstrates third normal form (3NF) relational schema design, primary and foreign key integrity constraints, complex SQL joins, views, stored procedures with transaction handling, stored functions, cursor-based reporting, and automated database triggers.

---

## 2. Problem Statement
In developing economies, millions of eligible citizens miss out on life-changing welfare schemes due to:
1. **Information Fragmentation:** Scheme guidelines are scattered across dozens of ministerial websites, local gazettes, and district notices.
2. **Ambiguous Criteria Interpretation:** Complex eligibility rules (e.g. land ownership ceilings, annual family income brackets, demographic reservations) are difficult for laypersons to interpret accurately.
3. **Approaching Deadlines:** Lack of unified tracking leads to missed application cut-off dates.
4. **Disorganized Application Requirements:** Citizens often visit government offices only to be turned away due to missing supporting documents.

The proposed system addresses these challenges through a centralized relational database and an automated eligibility matching engine.

---

## 3. Existing Systems vs. Proposed System

| Dimension | Existing Fragmented Portals | Proposed System |
| :--- | :--- | :--- |
| **Data Organization** | Isolated department websites with heterogeneous formats | Centralized, 3NF-normalized relational database in MySQL |
| **Eligibility Assessment** | Manual reading of long PDF gazettes | Automated, criterion-by-criterion rule matching engine |
| **Transparency** | Binary approval/rejection with little explanation | Detailed explanation for each satisfied/unsatisfied rule |
| **Bookmark & Tracking** | No persistent saving across departments | User profile with personalized bookmarks and saved schemes |
| **Administrative Integrity** | Manual, unmonitored website updates | Role-based admin console with audit logging (`scheme_audit_log`) |
| **DBMS Concepts** | Proprietary black-box architectures | Full demonstration of DDL, DML, Joins, Views, SPs, Cursors, and Triggers |

---

## 4. Key Objectives
1. **Relational Schema Design & Normalization:** Construct an 8-table database normalized up to Third Normal Form (3NF) to eliminate data redundancy, update anomalies, and insertion inconsistencies.
2. **Role-Based Web Application:** Implement distinct citizen and administrative interfaces with secure authentication, session management, and CSRF protection.
3. **Dynamic Application Lifecycle Calculation:** Utilize SQL views and stored functions to dynamically determine whether a scheme is *Upcoming*, *Open*, or *Closed* relative to `CURDATE()` without storing stale status values.
4. **Explainable Eligibility Evaluation:** Implement an allowlisted rule engine that compares user demographics with scheme criteria and produces clear guidance (*Likely Eligible*, *Not Eligible*, or *More Information Required*).
5. **Practical DBMS Demonstration:** Provide executable scripts for stored procedures with atomic transactions, stored functions, cursor iteration, and before/after triggers.
