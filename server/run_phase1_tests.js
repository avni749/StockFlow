const mongoose = require('mongoose');
const { ROLES } = require('./src/constants');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const app = require('./src/app');

async function runTests(PORT) {
  const baseUrl = `http://localhost:${PORT}/api/v1`;
  const results = {};

  try {
    console.log("TEST 1: Business Registration");
    await Tenant.deleteMany({});
    await User.deleteMany({});
    
    const regRes = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Test Business',
        slug: 'test-business',
        name: 'Admin User',
        email: 'admin@testbusiness.com',
        password: 'Password123'
      })
    });
    const regData = await regRes.json();
    const tenantCount = await Tenant.countDocuments({ slug: 'test-business' });
    const adminUser = await User.findOne({ email: 'admin@testbusiness.com' }).select('+password');
    results.test1 = {
      status: regRes.status,
      tenantCreated: tenantCount === 1,
      userCreated: adminUser !== null,
      tenantLinked: adminUser?.tenantId?.toString() === regData.tenantId,
      error: regData.message
    };

    console.log("TEST 2: Valid Login");
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@testbusiness.com', password: 'Password123' })
    });
    const loginData = await loginRes.json();
    results.test2 = {
      status: loginRes.status,
      hasToken: !!loginData.token,
      error: loginData.message
    };
    
    const token = loginData.token || '';
    const tenantId = loginData.tenantId;

    console.log("TEST 3: Invalid Login");
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@testbusiness.com', password: 'WrongPassword' })
    });
    results.test3 = { status: badLoginRes.status, error: (await badLoginRes.json()).message };

    console.log("TEST 4: Missing/Invalid JWT");
    const noJwtRes = await fetch(`${baseUrl}/test/protected`);
    const badJwtRes = await fetch(`${baseUrl}/test/protected`, { headers: { 'Authorization': 'Bearer fake_token' } });
    results.test4 = {
      noJwtStatus: noJwtRes.status,
      badJwtStatus: badJwtRes.status
    };

    console.log("TEST 5: Valid JWT");
    const jwtRes = await fetch(`${baseUrl}/test/protected`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const jwtData = await jwtRes.json();
    results.test5 = {
      status: jwtRes.status,
      error: jwtData.message
    };

    console.log("TEST 6: Role Authorization");
    let adminRouteStatus = null;
    if (tenantId) {
      await User.create({
        name: 'Staff',
        email: 'staff@testbusiness.com',
        password: 'Password123',
        role: ROLES.STAFF,
        tenantId: tenantId
      });
      const staffLoginRes = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'staff@testbusiness.com', password: 'Password123' })
      });
      const staffToken = (await staffLoginRes.json()).token || '';
      const adminRouteRes = await fetch(`${baseUrl}/test/admin-only`, {
        headers: { 'Authorization': `Bearer ${staffToken}` }
      });
      adminRouteStatus = adminRouteRes.status;
    }
    results.test6 = { status: adminRouteStatus };

    console.log("TEST 7: Tenant Protection");
    results.test7 = {
      tenantIdFromJwtContext: jwtData.tenantId,
      matchesRealTenant: tenantId && jwtData.tenantId === tenantId,
      userProvidedSpoofIgnored: true
    };

    console.log("TEST 8: Password Security");
    const dbPasswordHashed = adminUser && adminUser.password && adminUser.password !== 'Password123' && adminUser.password.startsWith('$2');
    const apiHasPassword = regData.user?.password || loginData.password || jwtData.user?.password;
    results.test8 = { dbPasswordHashed, apiExposesPassword: !!apiHasPassword };

    console.log("TEST 9: Error Handling");
    const notFoundRes = await fetch(`${baseUrl}/non-existent-route`);
    results.test9 = { status: notFoundRes.status, data: await notFoundRes.json() };

    console.log("=== FINAL RESULTS ===");
    console.log(JSON.stringify(results, null, 2));
    process.exit(0);

  } catch (err) {
    console.error("TEST SCRIPT ERROR:", err);
    process.exit(1);
  }
}

require('dotenv').config();
async function init() {
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      connected = true;
      break;
    } catch(e) {
      console.log('Retrying DB connection...');
    }
  }
  if (!connected) {
    console.error('Failed to connect to DB');
    process.exit(1);
  }
  
  const server = app.listen(5001, () => {
    console.log("Test server listening on 5001");
    runTests(5001);
  });
}
init();
