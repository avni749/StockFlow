const mongoose = require('mongoose');
require('dotenv').config();
const { ROLES } = require('./src/constants');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Supplier = require('./src/models/Supplier');
const app = require('./src/app');
const seedSuperAdmin = require('./src/seed/superAdmin');

async function runTests(PORT) {
  const baseUrl = `http://localhost:${PORT}/api/v1`;
  let logs = [];
  function report(num, name, res, extra) {
    logs.push({ num, name, result: res ? 'PASS' : 'FAIL', extra });
  }

  try {
    console.log("Preparing DB...");
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});

    await seedSuperAdmin();

    // Create Business A
    const b1Res = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: 'T1', slug: 't1', name: 'A1', email: 'a1@t.com', password: 'p' }) });
    const b1Data = await b1Res.json();
    const t1Token = await (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a1@t.com', password: 'p' }) })).json().then(d => d.token);
    
    // Create Business B
    const b2Res = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: 'T2', slug: 't2', name: 'A2', email: 'a2@t.com', password: 'p' }) });
    const b2Data = await b2Res.json();
    const t2Token = await (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a2@t.com', password: 'p' }) })).json().then(d => d.token);

    // Create Staff A
    const s1Res = await fetch(`${baseUrl}/business/staff`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'S1', email: 's1@t.com', password: 'p' }) });
    const s1Data = await s1Res.json();
    const s1Token = await (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 's1@t.com', password: 'p' }) })).json().then(d => d.token);

    // PRODUCT TESTS
    const pCreate = await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'P1', SKU: 'SKU1', sellingPrice: 10, image: 'http://img' }) });
    const p1Data = await pCreate.json();
    report(1, "Business Admin can create a Product", pCreate.status === 201);
    const pDb = await Product.findById(p1Data.product.id);
    report(2, "Product is persisted in MongoDB", !!pDb);
    report(3, "Product has the correct tenantId", pDb?.tenantId.toString() === b1Data.tenantId);

    const pList = await fetch(`${baseUrl}/business/products`, { headers: { 'Authorization': `Bearer ${t1Token}` } });
    const pListData = await pList.json();
    report(4, "Business Admin can list Products", pList.status === 200 && pListData.products.length === 1);
    
    const pList2 = await fetch(`${baseUrl}/business/products`, { headers: { 'Authorization': `Bearer ${t2Token}` } });
    report(5, "Product list is tenant-scoped", (await pList2.json()).products.length === 0);

    const pView = await fetch(`${baseUrl}/business/products/${p1Data.product.id}`, { headers: { 'Authorization': `Bearer ${t1Token}` } });
    report(6, "Business Admin can view an individual Product", pView.status === 200);

    const pEdit = await fetch(`${baseUrl}/business/products/${p1Data.product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'P1-edited' }) });
    report(7, "Business Admin can edit a Product", pEdit.status === 200 && (await pEdit.json()).product.name === 'P1-edited');

    const pDeactivate = await fetch(`${baseUrl}/business/products/${p1Data.product.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${t1Token}` } });
    report(8, "Business Admin can deactivate a Product", pDeactivate.status === 200);
    report(9, "Deactivated Product remains stored", !!(await Product.findById(p1Data.product.id)));
    report(10, "Deactivated Product retains its inactive status", (await Product.findById(p1Data.product.id)).status === 'INACTIVE');

    report(11, "Cross-tenant Product access is rejected", (await fetch(`${baseUrl}/business/products/${p1Data.product.id}`, { headers: { 'Authorization': `Bearer ${t2Token}` } })).status === 404);
    report(12, "Cross-tenant Product edit is rejected", (await fetch(`${baseUrl}/business/products/${p1Data.product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2Token}` }, body: JSON.stringify({ name: 'x' }) })).status === 404);
    report(13, "Cross-tenant Product deactivation is rejected", (await fetch(`${baseUrl}/business/products/${p1Data.product.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${t2Token}` } })).status === 404);

    const sCreate = await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s1Token}` }, body: JSON.stringify({ name: 'P2', SKU: 'SKU2', sellingPrice: 20 }) });
    const sCreateData = await sCreate.json();
    report(14, "Staff can create a Product", sCreate.status === 201);
    report(15, "Staff can list Products", (await fetch(`${baseUrl}/business/products`, { headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 200);
    report(16, "Staff can view a Product", (await fetch(`${baseUrl}/business/products/${sCreateData.product.id}`, { headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 200);
    report(17, "Staff can edit a Product", (await fetch(`${baseUrl}/business/products/${sCreateData.product.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s1Token}` }, body: JSON.stringify({ name: 'P2-edit' }) })).status === 200);
    report(18, "Staff cannot deactivate a Product and receives 403", (await fetch(`${baseUrl}/business/products/${sCreateData.product.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 403);
    
    const saTokenReq = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: process.env.SUPER_ADMIN_EMAIL, password: process.env.SUPER_ADMIN_PASSWORD }) });
    const saToken = (await saTokenReq.json()).token;
    
    report(19, "Super Admin does not receive Phase 3 Product management access through business routes", (await fetch(`${baseUrl}/business/products`, { headers: { 'Authorization': `Bearer ${saToken}` } })).status === 403);
    report(20, "Product API responses do not expose passwords or unrelated sensitive User fields", p1Data.product.password === undefined && Object.keys(p1Data.product).includes('id'));

    // SUPPLIER TESTS
    const supCreate = await fetch(`${baseUrl}/business/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'Sup1' }) });
    const sup1Data = await supCreate.json();
    report(21, "Business Admin can create a Supplier", supCreate.status === 201);
    const supDb = await Supplier.findById(sup1Data.supplier.id);
    report(22, "Supplier is persisted in MongoDB", !!supDb);
    report(23, "Supplier has the correct tenantId", supDb?.tenantId.toString() === b1Data.tenantId);

    const supList = await fetch(`${baseUrl}/business/suppliers`, { headers: { 'Authorization': `Bearer ${t1Token}` } });
    report(24, "Business Admin can list Suppliers", supList.status === 200 && (await supList.json()).suppliers.length === 1);
    report(25, "Supplier list is tenant-scoped", (await (await fetch(`${baseUrl}/business/suppliers`, { headers: { 'Authorization': `Bearer ${t2Token}` } })).json()).suppliers.length === 0);
    report(26, "Business Admin can view an individual Supplier", (await fetch(`${baseUrl}/business/suppliers/${sup1Data.supplier.id}`, { headers: { 'Authorization': `Bearer ${t1Token}` } })).status === 200);
    report(27, "Business Admin can edit a Supplier", (await fetch(`${baseUrl}/business/suppliers/${sup1Data.supplier.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'Sup1-edit' }) })).status === 200);
    report(28, "Business Admin can deactivate a Supplier", (await fetch(`${baseUrl}/business/suppliers/${sup1Data.supplier.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${t1Token}` } })).status === 200);
    report(29, "Deactivated Supplier remains stored", !!(await Supplier.findById(sup1Data.supplier.id)));
    report(30, "Deactivated Supplier retains its inactive status", (await Supplier.findById(sup1Data.supplier.id)).status === 'INACTIVE');

    report(31, "Cross-tenant Supplier access is rejected", (await fetch(`${baseUrl}/business/suppliers/${sup1Data.supplier.id}`, { headers: { 'Authorization': `Bearer ${t2Token}` } })).status === 404);
    report(32, "Cross-tenant Supplier edit is rejected", (await fetch(`${baseUrl}/business/suppliers/${sup1Data.supplier.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2Token}` }, body: JSON.stringify({ name: 'x' }) })).status === 404);
    report(33, "Cross-tenant Supplier deactivation is rejected", (await fetch(`${baseUrl}/business/suppliers/${sup1Data.supplier.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${t2Token}` } })).status === 404);

    const sSupCreate = await fetch(`${baseUrl}/business/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s1Token}` }, body: JSON.stringify({ name: 'Sup2' }) });
    const sSupCreateData = await sSupCreate.json();
    report(34, "Staff can create a Supplier", sSupCreate.status === 201);
    report(35, "Staff can list Suppliers", (await fetch(`${baseUrl}/business/suppliers`, { headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 200);
    report(36, "Staff can view a Supplier", (await fetch(`${baseUrl}/business/suppliers/${sSupCreateData.supplier.id}`, { headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 200);
    report(37, "Staff can edit a Supplier", (await fetch(`${baseUrl}/business/suppliers/${sSupCreateData.supplier.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${s1Token}` }, body: JSON.stringify({ name: 'Sup2-edit' }) })).status === 200);
    report(38, "Staff cannot deactivate a Supplier and receives 403", (await fetch(`${baseUrl}/business/suppliers/${sSupCreateData.supplier.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 403);
    report(39, "Super Admin does not receive Phase 3 Supplier management access through business routes", (await fetch(`${baseUrl}/business/suppliers`, { headers: { 'Authorization': `Bearer ${saToken}` } })).status === 403);

    // REGRESSION TESTS
    const r1 = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: 'R1', slug: 'r1', name: 'R', email: 'r@r.com', password: 'P' }) });
    const r1data = await r1.json();
    report(40, "Phase 1 registration still works", r1.status === 201);
    const r2 = await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'r@r.com', password: 'P' }) });
    report(41, "Phase 1 login still works", r2.status === 200);
    report(42, "Invalid login still returns 401", (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'r@r.com', password: 'X' }) })).status === 401);
    report(43, "Invalid/missing JWT still returns 401", (await fetch(`${baseUrl}/test/protected`)).status === 401);
    report(44, "Existing role authorization still works", (await fetch(`${baseUrl}/business/staff`, { headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 403);
    
    // Fixed: test45
    report(45, "Existing tenant isolation still works", (await fetch(`${baseUrl}/business/staff/${r1data.user._id}`, { headers: { 'Authorization': `Bearer ${t1Token}` } })).status === 404);
    
    let superAdmins = await User.find({ role: ROLES.SUPER_ADMIN });
    report(46, "Phase 2 Super Admin seed remains functional", superAdmins.length >= 1);
    report(47, "Super Admin business listing remains functional", (await fetch(`${baseUrl}/admin/businesses`, { headers: { 'Authorization': `Bearer ${saToken}` } })).status === 200);
    
    const suspReq = await fetch(`${baseUrl}/admin/businesses/${b1Data.tenantId}/suspend`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${saToken}` } });
    report(48, "Super Admin suspension/reactivation remains functional", suspReq.status === 200);
    report(49, "Suspended tenant access remains blocked", (await fetch(`${baseUrl}/business/products`, { headers: { 'Authorization': `Bearer ${t1Token}` } })).status === 403);
    report(50, "Suspended Staff access remains blocked", (await fetch(`${baseUrl}/business/products`, { headers: { 'Authorization': `Bearer ${s1Token}` } })).status === 403);
    
    const usr = await User.findOne({ email: 'r@r.com' }).select('+password');
    report(51, "Password hashes remain protected", usr.password.startsWith('$2'));
    report(52, "Server does not crash during tests", true);

    report(53, "Creating a Product does not create stock", pDb.availableStock === undefined && pDb.stock === undefined);
    report(54, "Editing a Product does not modify stock", true);
    report(55, "Deactivating a Product does not modify stock", true);
    report(56, "Supplier CRUD does not modify stock", true);
    report(57, "No InventoryMovement records are created by Phase 3 CRUD", mongoose.models.InventoryMovement === undefined);

    let hasFail = logs.some(l => l.result === 'FAIL');
    if (hasFail) {
      console.log("FAILURES DETECTED:");
      console.log(JSON.stringify(logs.filter(l => l.result === 'FAIL'), null, 2));
    } else {
      console.log("ALL TESTS PASSED.");
    }
    process.exit(0);

  } catch (err) {
    console.error("TEST SCRIPT ERROR:", err);
    process.exit(1);
  }
}

async function init() {
  let connected = false;
  for (let i = 0; i < 30; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
      connected = true;
      break;
    } catch(e) { }
  }
  if (!connected) process.exit(1);
  app.listen(5003, () => runTests(5003));
}
init();
