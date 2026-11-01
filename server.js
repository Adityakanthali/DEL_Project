/**
 * Server Entry Point
 * Boots the Express application and verifies database connectivity.
 */

import app from './src/app.js';
import { ENV } from './src/config/env.js';
import { testConnection } from './src/config/db.js';

async function startServer() {
  console.log('='.repeat(70));
  console.log(' GOVERNMENT SCHEME MANAGEMENT AND ELIGIBILITY RECOMMENDATION SYSTEM ');
  console.log(' College DBMS Mini-Project | Full-Stack Express & MySQL Architecture ');
  console.log('='.repeat(70));

  // Check MySQL Database Connectivity
  console.log(`Checking connection to MySQL database "${ENV.DB.database}" at ${ENV.DB.host}:${ENV.DB.port}...`);
  const isDbConnected = await testConnection();

  if (isDbConnected) {
    console.log('✅ MySQL Database connected successfully via connection pool.');
  } else {
    console.warn('⚠️  Warning: Could not connect to MySQL server.');
    console.warn('   Ensure MySQL is running and database "government_scheme_db" is created.');
    console.warn('   Import SQL scripts in `database/` in sequential order (01 to 09).');
  }

  app.listen(ENV.PORT, () => {
    console.log(`🚀 Server running in ${ENV.NODE_ENV} mode on:`);
    console.log(`   👉 Citizen Portal:   http://localhost:${ENV.PORT}`);
    console.log(`   👉 Admin Login:      http://localhost:${ENV.PORT}/admin-login.html`);
    console.log(`   👉 Admin Dashboard:  http://localhost:${ENV.PORT}/admin-dashboard.html`);
    console.log(`   👉 API Health:       http://localhost:${ENV.PORT}/api/health`);
    console.log('-'.repeat(70));
    console.log('Default Demo Accounts:');
    console.log('   Admin:   admin@govscheme.in   | Password: Admin@123');
    console.log('   Citizen: rahul.sharma@example.com | Password: Citizen@123');
    console.log('='.repeat(70));
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Error:', err);
  process.exit(1);
});
