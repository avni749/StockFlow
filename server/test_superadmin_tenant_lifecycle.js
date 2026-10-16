const mongoose = require('mongoose');
const { ROLES } = require('./src/constants');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const app = require('./src/app');
const seedSuperAdmin = require('./src/seed/superAdmin');

async function runTests(PORT) {
  const baseUrl = `http://localhost:${PORT}/api/v1`;
  const results = {};

  try {
    console.log("Preparing DB...");
    await Tenant.deleteMany({});
    await User.deleteMany({});
    
    // 1. Super Admin creation/seed
    console.log("TEST 1: Super Admin creation/seed");
    await seedSuperAdmin();
    const superAdmin = await User.findOne({ role: ROLES.SUPER_ADMIN }).select('+password');
    results.test1 = {
      status: superAdmin ? 'PASS' : 'FAIL',
      created: !!superAdmin,
      isSuperAdmin: superAdmin?.role === ROLES.SUPER_ADMIN,
      hasTenant: superAdmin?.tenantId !== null
    };

    // 2. Super Admin login
    console.log("TEST 2: Super Admin login");
    const saLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD })
    });
    const saLoginData = await saLoginRes.json();
    results.test2 = {
      status: saLoginRes.status === 200 ? 'PASS' : 'FAIL',
      hasToken: !!saLoginData.token
    };
    const saToken = saLoginData.token;

    // Create Business 1 for testing
    const b1Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Business One', slug: 'b1', name: 'Admin One', email: 'a1@b1.com', password: 'P1'
      })
    });
    const b1Data = await b1Res.json();
    const b1Token = await (await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a1@b1.com', password: 'P1' })
    })).json().then(d => d.token);

    // Create Business 2 for testing
    const b2Res = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        businessName: 'Business Two', slug: 'b2', name: 'Admin Two', email: 'a2@b2.com', password: 'P2'
      })
    });
    const b2Data = await b2Res.json();
    const b2Token = await (await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'a2@b2.com', password: 'P2' })
    })).json().then(d => d.token);

    // 3. Super Admin can view businesses
    console.log("TEST 3: Super Admin can view businesses");
    const viewRes = await fetch(`${baseUrl}/admin/businesses`, {
      headers: { 'Authorization': `Bearer ${saToken}` }
    });
    const viewData = await viewRes.json();
    results.test3 = {
      status: viewRes.status === 200 ? 'PASS' : 'FAIL',
      count: viewData.businesses?.length
    };

    // 4. Super Admin can suspend a business
    console.log("TEST 4: Super Admin can suspend a business");
    const suspendRes = await fetch(`${baseUrl}/admin/businesses/${b1Data.tenantId}/suspend`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${saToken}` }
    });
    const suspendData = await suspendRes.json();
    results.test4 = {
      status: suspendRes.status === 200 ? 'PASS' : 'FAIL',
      newStatus: suspendData.business?.status
    };

    // 5. Suspended business status is persisted in MongoDB
    console.log("TEST 5: Suspended business status is persisted in MongoDB");
    const tenantInDb = await Tenant.findById(b1Data.tenantId);
    results.test5 = {
      status: tenantInDb.status === 'SUSPENDED' ? 'PASS' : 'FAIL',
      dbStatus: tenantInDb.status
    };

    // 6. Suspended business user access is rejected
    console.log("TEST 6: Suspended business user access is rejected");
    const accessRes = await fetch(`${baseUrl}/test/protected`, {
      headers: { 'Authorization': `Bearer ${b1Token}` }
    });
    results.test6 = {
      status: accessRes.status === 403 ? 'PASS' : 'FAIL',
      statusCode: accessRes.status
    };

    // 7. Super Admin can reactivate the business
    console.log("TEST 7: Super Admin can reactivate the business");
    const reactivateRes = await fetch(`${baseUrl}/admin/businesses/${b1Data.tenantId}/reactivate`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${saToken}` }
    });
    const reactivateData = await reactivateRes.json();
    results.test7 = {
      status: reactivateRes.status === 200 ? 'PASS' : 'FAIL',
      newStatus: reactivateData.business?.status
    };

    // 8. Reactivated business access works again
    console.log("TEST 8: Reactivated business access works again");
    const accessRes2 = await fetch(`${baseUrl}/test/protected`, {
      headers: { 'Authorization': `Bearer ${b1Token}` }
    });
    results.test8 = {
      status: accessRes2.status === 200 ? 'PASS' : 'FAIL',
      statusCode: accessRes2.status
    };

    // 9. Business Admin can manage only users from their own tenant
    console.log("TEST 9: Business Admin can manage only users from their own tenant");
    const createStaffRes = await fetch(`${baseUrl}/business/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${b1Token}` },
      body: JSON.stringify({ name: 'Staff1', email: 's1@b1.com', password: 'p' })
    });
    const createStaffData = await createStaffRes.json();
    const getStaffRes = await fetch(`${baseUrl}/business/staff`, {
      headers: { 'Authorization': `Bearer ${b1Token}` }
    });
    const getStaffData = await getStaffRes.json();
    results.test9 = {
      status: createStaffRes.status === 201 && getStaffData.staff?.length === 1 ? 'PASS' : 'FAIL',
      staffCount: getStaffData.staff?.length
    };

    // 10. Business Admin cannot access another tenant's users
    console.log("TEST 10: Business Admin cannot access another tenant's users");
    const b2AccessB1Res = await fetch(`${baseUrl}/business/staff/${createStaffData.staff.id}`, {
      headers: { 'Authorization': `Bearer ${b2Token}` }
    });
    results.test10 = {
      status: b2AccessB1Res.status === 404 ? 'PASS' : 'FAIL',
      statusCode: b2AccessB1Res.status
    };

    // 11. Staff cannot access Business Admin/Super Admin functionality
    console.log("TEST 11: Staff cannot access Business Admin/Super Admin functionality");
    const s1Token = await (await fetch(`${baseUrl}/auth/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 's1@b1.com', password: 'p' })
    })).json().then(d => d.token);
    
    const s1AdminRes = await fetch(`${baseUrl}/admin/businesses`, {
      headers: { 'Authorization': `Bearer ${s1Token}` }
    });
    const s1BusRes = await fetch(`${baseUrl}/business/staff`, {
      headers: { 'Authorization': `Bearer ${s1Token}` }
    });
    results.test11 = {
      status: s1AdminRes.status === 403 && s1BusRes.status === 403 ? 'PASS' : 'FAIL',
      adminStatus: s1AdminRes.status,
      busStatus: s1BusRes.status
    };

    // 12. Existing Phase 1 authentication still works
    console.log("TEST 12: Existing Phase 1 authentication still works");
    const p1Res = await fetch(`${baseUrl}/test/protected`, {
      headers: { 'Authorization': `Bearer ${b2Token}` }
    });
    results.test12 = {
      status: p1Res.status === 200 ? 'PASS' : 'FAIL'
    };

    // 13. Existing tenant isolation still works
    console.log("TEST 13: Existing tenant isolation still works");
    const p1Data = await p1Res.json();
    results.test13 = {
      status: p1Data.tenantId === b2Data.tenantId ? 'PASS' : 'FAIL'
    };

    // 14. Existing password security remains intact
    console.log("TEST 14: Existing password security remains intact");
    const staffDb = await User.findById(createStaffData.staff.id).select('+password');
    results.test14 = {
      status: staffDb.password.startsWith('$2') && !createStaffData.staff.password ? 'PASS' : 'FAIL'
    };

    // 15. Invalid/unauthorized requests return controlled responses
    console.log("TEST 15: Invalid/unauthorized requests return controlled responses");
    const errRes = await fetch(`${baseUrl}/business/staff`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${b1Token}` },
      body: JSON.stringify({ name: 'Staff1' }) // Missing email/password
    });
    const errData = await errRes.json();
    results.test15 = {
      status: errRes.status === 400 && !!errData.message ? 'PASS' : 'FAIL'
    };

    // 16. Server does not crash during the tests
    console.log("TEST 16: Server does not crash during the tests");
    const finalRes = await fetch(`${baseUrl}/test/protected`, {
      headers: { 'Authorization': `Bearer ${b1Token}` }
    });
    results.test16 = {
      status: finalRes.status === 200 ? 'PASS' : 'FAIL'
    };

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
