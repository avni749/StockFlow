const mongoose = require('mongoose');
const { ROLES } = require('./src/constants');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');

async function runTests() {
  const PORT = process.env.PORT || 5000;
  const baseUrl = `http://localhost:${PORT}/api/v1`;
  const results = {};

  try {
    // Wait a second for DB connection to settle in the background server
    await new Promise(r => setTimeout(r, 2000));
    
    // Clear DB for clean test
    await Tenant.deleteMany({});
    await User.deleteMany({});
    
    // TEST 1: MongoDB Atlas Connection
    results.test1 = mongoose.connection.readyState === 1 ? 'PASS' : 'FAIL';

    // TEST 2: Business Registration
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test Corp',
        slug: 'test-corp',
        name: 'Admin User',
        email: 'admin@testcorp.com',
        password: 'Password123'
      })
    });
    const regData = await regRes.json();
    results.test2 = regRes.status === 201 ? 'PASS' : 'FAIL';

    // TEST 3 & 4: Tenant & Initial BUSINESS_ADMIN creation
    const tenantCount = await Tenant.countDocuments({ slug: 'test-corp' });
    const userCount = await User.countDocuments({ email: 'admin@testcorp.com', role: ROLES.BUSINESS_ADMIN });
    results.test3 = tenantCount === 1 ? 'PASS' : 'FAIL';
    results.test4 = userCount === 1 ? 'PASS' : 'FAIL';

    // TEST 5: Valid login
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@testcorp.com', password: 'Password123' })
    });
    const loginData = await loginRes.json();
    results.test5 = loginRes.status === 200 && loginData.token ? 'PASS' : 'FAIL';
    const token = loginData.token;
    const tenantId = loginData.tenantId;

    // TEST 6: Invalid login
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@testcorp.com', password: 'WrongPassword' })
    });
    results.test6 = badLoginRes.status === 401 ? 'PASS' : 'FAIL';

    // TEST 7: Missing/invalid JWT rejection
    const noJwtRes = await fetch(`${baseUrl}/test/protected`);
    results.test7 = noJwtRes.status === 401 ? 'PASS' : 'FAIL';

    // TEST 8: Valid JWT access
    const jwtRes = await fetch(`${baseUrl}/test/protected`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    results.test8 = jwtRes.status === 200 ? 'PASS' : 'FAIL';

    // TEST 10: Tenant protection
    // Check if the endpoint successfully pulled the tenantId from the user context
    const jwtData = await jwtRes.json();
    results.test10 = jwtData.tenantId === tenantId ? 'PASS' : 'FAIL';

    // TEST 11: Password exclusion
    // Check if password exists in the register or login response
    const hasPassword = regData.user?.password || loginData.password || jwtData.user?.password;
    results.test11 = !hasPassword ? 'PASS' : 'FAIL';

    // TEST 9: Role restriction
    // Create a STAFF user directly in DB
    const staffUser = await User.create({
      name: 'Staff User',
      email: 'staff@testcorp.com',
      password: 'Password123', // Will be hashed by pre-save hook
      role: ROLES.STAFF,
      tenantId: tenantId
    });
    
    // Login as STAFF
    const staffLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'staff@testcorp.com', password: 'Password123' })
    });
    const staffLoginData = await staffLoginRes.json();
    const staffToken = staffLoginData.token;

    // Try accessing Admin-only route
    const adminRouteRes = await fetch(`${baseUrl}/test/admin-only`, {
      headers: { 'Authorization': `Bearer ${staffToken}` }
    });
    results.test9 = adminRouteRes.status === 403 ? 'PASS' : 'FAIL';

    console.log(JSON.stringify(results));
    process.exit(0);

  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

// Connect to DB and run tests
require('dotenv').config();
const dbUri = process.env.MONGO_URI;
mongoose.connect(dbUri).then(() => {
  runTests();
}).catch(err => {
  console.error("DB Connection failed", err);
  process.exit(1);
});
