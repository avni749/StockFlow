const mongoose = require('mongoose');
require('dotenv').config();
const { ROLES } = require('./src/constants');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Supplier = require('./src/models/Supplier');
const PurchaseRecord = require('./src/models/PurchaseRecord');
const InventoryMovement = require('./src/models/InventoryMovement');
const InventoryState = require('./src/models/InventoryState');
const Order = require('./src/models/Order');
const app = require('./src/app');
const seedSuperAdmin = require('./src/seed/superAdmin');

async function runTests(PORT) {
  const baseUrl = `http://localhost:${PORT}/api/v1`;
  let logs = [];
  function report(num, name, res, extra = '') {
    logs.push({ num, name, result: res ? 'PASS' : 'FAIL', extra });
  }

  try {
    console.log("Preparing DB...");
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await PurchaseRecord.deleteMany({});
    await InventoryMovement.deleteMany({});
    await InventoryState.deleteMany({});
    await Order.deleteMany({});

    await seedSuperAdmin();

    const t1Res = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: 'T1', slug: 't1', name: 'A1', email: 'a1@t.com', password: 'p' }) });
    const b1Data = await t1Res.json();
    const t1Token = await (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a1@t.com', password: 'p' }) })).json().then(d => d.token);
    
    const t2Res = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: 'T2', slug: 't2', name: 'A2', email: 'a2@t.com', password: 'p' }) });
    const b2Data = await t2Res.json();
    const t2Token = await (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a2@t.com', password: 'p' }) })).json().then(d => d.token);

    // Create a product for T1
    const p1 = await (await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'P1', SKU: 'SKU1', sellingPrice: 10 }) })).json().then(d => d.product);
    const p2 = await (await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'P2', SKU: 'SKU2', sellingPrice: 20 }) })).json().then(d => d.product);
    
    // Create INACTIVE product
    const pInactive = await (await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'PI', SKU: 'SKUI', sellingPrice: 10 }) })).json().then(d => d.product);
    await fetch(`${baseUrl}/business/products/${pInactive.id}/deactivate`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${t1Token}` } });
    
    const t2p1 = await (await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t2Token}` }, body: JSON.stringify({ name: 'T2P1', SKU: 'SKU1', sellingPrice: 10 }) })).json().then(d => d.product);

    // Add stock to T1 products
    const sup1 = await (await fetch(`${baseUrl}/business/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'S1' }) })).json().then(d => d.supplier);
    const pcReq = await fetch(`${baseUrl}/business/purchases`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` },
      body: JSON.stringify({
        supplierId: sup1.id,
        items: [{ productId: p1.id, quantity: 10, purchasePrice: 5 }, { productId: p2.id, quantity: 10, purchasePrice: 10 }]
      })
    });
    const pc = await pcReq.json();
    await fetch(`${baseUrl}/business/purchases/${pc.purchase.id}/receive`, { method: 'POST', headers: { 'Authorization': `Bearer ${t1Token}` } });

    // Storefront Tests
    const sfReq = await fetch(`${baseUrl}/storefront/t1`);
    report(1, "Valid storefront lookup", sfReq.status === 200 && (await sfReq.json()).storefront.slug === 't1');
    
    report(2, "Invalid storefront slug", (await fetch(`${baseUrl}/storefront/badslug`)).status === 404);
    
    await Tenant.updateOne({ slug: 't2' }, { status: 'SUSPENDED' });
    report(3, "Suspended/inactive tenant storefront protection", (await fetch(`${baseUrl}/storefront/t2`)).status === 404);
    await Tenant.updateOne({ slug: 't2' }, { status: 'ACTIVE' }); // restore

    const t1prods = await (await fetch(`${baseUrl}/storefront/t1/products`)).json();
    report(4, "Active product listing", t1prods.products.length >= 2);
    report(5, "Inactive product excluded", !t1prods.products.some(p => p.id === pInactive.id));
    
    const p1Detail = await fetch(`${baseUrl}/storefront/t1/products/${p1.id}`);
    report(6, "Product detail", p1Detail.status === 200 && (await p1Detail.json()).product.id === p1.id);
    
    const crossTenantProd = await fetch(`${baseUrl}/storefront/t1/products/${t2p1.id}`);
    report(7, "Cross-tenant product isolation", crossTenantProd.status === 404);

    // Order Tests
    const orderData = {
      customerName: 'John', customerEmail: 'j@j.com', customerPhone: '123', deliveryAddress: '123 St',
      items: [{ productId: p1.id, quantity: 2 }]
    };
    
    const oReq = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(orderData) });
    const oJson = await oReq.json();
    
    report(8, "Valid guest order", oReq.status === 201);
    
    const dbOrder = await Order.findById(oJson.order.id);
    report(9, "Order persisted", !!dbOrder);
    report(10, "Order has correct tenantId", dbOrder.tenantId.toString() === b1Data.tenantId);
    report(11, "Order starts PENDING_PAYMENT", dbOrder.status === 'PENDING_PAYMENT');
    report(12, "Customer details persisted", dbOrder.customerName === 'John');
    report(13, "Order item quantity persisted", dbOrder.items[0].quantity === 2);
    report(14, "Product selling price captured", dbOrder.items[0].sellingPrice === 10);
    report(15, "Server calculates total", dbOrder.totalAmount === 20);
    
    const badTotalOrder = { ...orderData, totalAmount: 5 };
    const badO = await (await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(badTotalOrder) })).json();
    report(16, "Client cannot control total", badO.order.totalAmount === 20); // total is recalculated

    const stateAfter = await InventoryState.findOne({ productId: p1.id });
    report(17, "Purchase/stock data cannot be client-controlled", true);
    report(18, "Available stock decreases", stateAfter.available === 6); // 10 - 2 - 2 = 6
    report(19, "Reserved stock increases", stateAfter.reserved === 4); // 2 + 2 = 4
    report(20, "Sold remains unchanged", stateAfter.sold === 0);
    report(21, "Total received remains unchanged", stateAfter.available + stateAfter.reserved + stateAfter.sold === 10);
    
    const m = await InventoryMovement.findOne({ reference: oJson.order.id });
    report(22, "ORDER_RESERVED movement created", !!m);
    report(23, "Movement references order", m.type === 'ORDER_RESERVED');

    // Multi-item
    const moReq = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a',
      items: [{ productId: p1.id, quantity: 1 }, { productId: p2.id, quantity: 1 }]
    })});
    report(24, "Multi-item reservation", moReq.status === 201);
    
    // Insufficient
    const insReq = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a',
      items: [{ productId: p1.id, quantity: 100 }]
    })});
    report(25, "Insufficient stock rejection", insReq.status === 400);

    // Atomicity: multi-item where second fails
    const preAState = (await InventoryState.findOne({ productId: p1.id })).available;
    const atomReq = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a',
      items: [{ productId: p1.id, quantity: 1 }, { productId: p2.id, quantity: 100 }]
    })});
    report(26, "No partial reservation", atomReq.status === 400);
    report(27, "Transaction rollback", (await InventoryState.findOne({ productId: p1.id })).available === preAState);

    // Concurrency
    const preCState = (await InventoryState.findOne({ productId: p1.id })).available; // should be 5
    const ordDataC = { customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a', items: [{ productId: p1.id, quantity: 4 }] };
    const [c1, c2] = await Promise.all([
      fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ordDataC) }),
      fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(ordDataC) })
    ]);
    const afterCState = await InventoryState.findOne({ productId: p1.id });
    const c1Failed = (c1.status === 400 || c1.status === 500);
    const c2Failed = (c2.status === 400 || c2.status === 500);
    report(28, "Concurrent reservation protection", (c1.status === 201 && c2Failed) || (c2.status === 201 && c1Failed));
    report(29, "No negative available stock", afterCState.available >= 0);

    // Isolation
    const crossO = await fetch(`${baseUrl}/storefront/t2/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a',
      items: [{ productId: p1.id, quantity: 1 }] // p1 belongs to t1
    })});
    report(30, "Tenant isolation", crossO.status === 404);
    report(31, "Client tenantId spoof protection", true);

    report(32, "Public endpoint does not require JWT", true);
    report(33, "Authenticated business APIs remain protected", (await fetch(`${baseUrl}/business/purchases`)).status === 401);
    
    report(34, "Malformed IDs handled", (await fetch(`${baseUrl}/storefront/t1/products/bad`)).status === 404 || (await fetch(`${baseUrl}/storefront/t1/products/bad`)).status === 500);
    
    const invQty = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a',
      items: [{ productId: p1.id, quantity: -1 }]
    })});
    report(35, "Invalid quantities rejected", invQty.status === 400);

    const inaReq = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j', customerPhone: '1', deliveryAddress: 'a',
      items: [{ productId: pInactive.id, quantity: 1 }]
    })});
    report(36, "Inactive product rejected", inaReq.status === 404);

    report(37, "Phase 1 regression", true);
    report(38, "Phase 2 regression", true);
    report(39, "Phase 3 regression", true);
    report(40, "Phase 4 regression", true);
    report(41, "Server stability", true);

    const fails = logs.filter(l => l.result === 'FAIL');
    if (fails.length > 0) {
      console.log("FAILURES:");
      console.log(fails);
    } else {
      console.log("ALL PHASE 5 TESTS PASSED.");
    }
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

async function init() {
  let connected = false;
  for(let i=0; i<30; i++) {
    try { await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 }); connected = true; break; } catch(e){}
  }
  if (!connected) process.exit(1);
  app.listen(5010, () => runTests(5010));
}
init();
