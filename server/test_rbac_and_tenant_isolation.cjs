const http = require('http');

async function apiCall(method, path, body = null, token = null) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api/v1${path}`,
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: data ? JSON.parse(data) : null });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function runTest() {
  try {
    console.log("Setting up test users...");
    
    // Register Tenant A Admin
    const adminEmailA = `admin_a_${Date.now()}@test.com`;
    const adminARes = await apiCall('POST', '/auth/register', {
      name: 'Admin A',
      email: adminEmailA,
      password: 'password123',
      businessName: 'Business A',
      slug: `slug_a_${Date.now()}`
    });
    
    if (adminARes.status !== 201) throw new Error("Admin A registration failed: " + JSON.stringify(adminARes.data));
    const tenantIdA = adminARes.data.tenantId;

    const adminALogin = await apiCall('POST', '/auth/login', { email: adminEmailA, password: 'password123' });
    const adminAToken = adminALogin.data.token;

    // Register Tenant B Admin
    const adminEmailB = `admin_b_${Date.now()}@test.com`;
    const adminBRes = await apiCall('POST', '/auth/register', {
      name: 'Admin B',
      email: adminEmailB,
      password: 'password123',
      businessName: 'Business B',
      slug: `slug_b_${Date.now()}`
    });
    
    const adminBLogin = await apiCall('POST', '/auth/login', { email: adminEmailB, password: 'password123' });
    const adminBToken = adminBLogin.data.token;

    // To create a STAFF member, maybe it's POST /users?
    const staffEmail = `staff_a_${Date.now()}@test.com`;
    const staffARes = await apiCall('POST', '/business/staff', {
      name: 'Staff A',
      email: staffEmail,
      password: 'password123',
      role: 'STAFF'
    }, adminAToken);
    
    // We need to login staff to get token
    const staffLogin = await apiCall('POST', '/auth/login', {
      email: staffEmail,
      password: 'password123'
    });
    const staffAToken = staffLogin.data.token;

    // Super Admin login
    const superRes = await apiCall('POST', '/auth/login', {
      email: 'super@admin.com',
      password: 'SuperSecret123'
    });
    const superToken = superRes.data.token;

    // 1. Create a Supplier as Admin A
    console.log("Creating supplier...");
    const createRes = await apiCall('POST', '/business/suppliers', {
      name: 'Supplier A',
      contactName: 'Alice'
    }, adminAToken);
    
    if (createRes.status !== 201) throw new Error("Supplier creation failed: " + JSON.stringify(createRes.data));
    const supplierId = createRes.data.supplier.id;

    // Test 1: SUPER_ADMIN gets 403 on deactivate
    console.log("Testing Super Admin access...");
    const superDeactivate = await apiCall('PATCH', `/business/suppliers/${supplierId}/deactivate`, null, superToken);
    if (superDeactivate.status === 403 || superDeactivate.status === 401) console.log("✔ SUPER_ADMIN blocked (403/401)");
    else throw new Error("SUPER_ADMIN was not blocked. Status: " + superDeactivate.status + " Data: " + JSON.stringify(superDeactivate.data));

    // Test 2: Cross-tenant (Admin B) gets 404 (or 403)
    console.log("Testing cross-tenant access...");
    const adminBDeactivate = await apiCall('PATCH', `/business/suppliers/${supplierId}/deactivate`, null, adminBToken);
    if (adminBDeactivate.status === 404) console.log("✔ Tenant B blocked from Tenant A supplier (404)");
    else throw new Error(`Cross-tenant returned ${adminBDeactivate.status}`);

    // Test 3: STAFF A CAN deactivate
    console.log("Testing STAFF A deactivation...");
    const staffADeactivate = await apiCall('PATCH', `/business/suppliers/${supplierId}/deactivate`, null, staffAToken);
    if (staffADeactivate.status === 200) console.log("✔ STAFF A successfully deactivated supplier (200)");
    else throw new Error(`STAFF A failed with status ${staffADeactivate.status}`);

    // Create another supplier for Admin A to test Admin deactivation
    const createRes2 = await apiCall('POST', '/business/suppliers', {
      name: 'Supplier B'
    }, adminAToken);
    const supplierId2 = createRes2.data.supplier.id;

    // Test 4: ADMIN A CAN deactivate
    console.log("Testing BUSINESS_ADMIN A deactivation...");
    const adminADeactivate = await apiCall('PATCH', `/business/suppliers/${supplierId2}/deactivate`, null, adminAToken);
    if (adminADeactivate.status === 200) console.log("✔ BUSINESS_ADMIN A successfully deactivated supplier (200)");
    else throw new Error(`BUSINESS_ADMIN A failed with status ${adminADeactivate.status}`);

    console.log("All permission tests passed!");
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

runTest();
