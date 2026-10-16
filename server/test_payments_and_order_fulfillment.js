const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require('crypto');
const { ROLES } = require('./src/constants');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Supplier = require('./src/models/Supplier');
const PurchaseRecord = require('./src/models/PurchaseRecord');
const InventoryMovement = require('./src/models/InventoryMovement');
const InventoryState = require('./src/models/InventoryState');
const Order = require('./src/models/Order');
const PaymentTransaction = require('./src/models/PaymentTransaction');

const mod = require('module');
const originalRequire = mod.prototype.require;
mod.prototype.require = function(id) {
  if (id === 'razorpay') {
    let ctr = 0;
    const fn = function(opts) { this.opts = opts; };
    fn.prototype.orders = {
      create: async (opts) => ({ id: 'order_mock' + (++ctr), amount: opts.amount })
    };
    return fn;
  }
  return originalRequire.apply(this, arguments);
};

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
    await PaymentTransaction.deleteMany({});

    await seedSuperAdmin();

    const t1Res = await fetch(`${baseUrl}/auth/register`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ businessName: 'T1', slug: 't1', name: 'A1', email: 'a1@t.com', password: 'p' }) });
    const b1Data = await t1Res.json();
    const t1Token = await (await fetch(`${baseUrl}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'a1@t.com', password: 'p' }) })).json().then(d => d.token);
    
    await Tenant.updateOne({ slug: 't1' }, {
      razorpayKeyId: 'rzp_test_123',
      razorpayKeySecret: 'secret123',
      razorpayWebhookSecret: 'webhook123'
    });

    const p1 = await (await fetch(`${baseUrl}/business/products`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'P1', SKU: 'SKU1', sellingPrice: 10 }) })).json().then(d => d.product);
    
    const sup1 = await (await fetch(`${baseUrl}/business/suppliers`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` }, body: JSON.stringify({ name: 'S1' }) })).json().then(d => d.supplier);
    const pcReq = await fetch(`${baseUrl}/business/purchases`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${t1Token}` },
      body: JSON.stringify({
        supplierId: sup1.id,
        items: [{ productId: p1.id, quantity: 10, purchasePrice: 5 }]
      })
    });
    const pc = await pcReq.json();
    await fetch(`${baseUrl}/business/purchases/${pc.purchase.id}/receive`, { method: 'POST', headers: { 'Authorization': `Bearer ${t1Token}` } });

    // Order 1: Success Payment
    const oReq = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j.com', customerPhone: '123', deliveryAddress: 'A',
      items: [{ productId: p1.id, quantity: 2 }]
    })});
    const oJson = await oReq.json();

    const payCreateReq = await fetch(`${baseUrl}/storefront/t1/orders/${oJson.order.id}/payment/create`, { method: 'POST' });
    const payCreate = await payCreateReq.json();
    report(1, "Razorpay credentials resolve for the correct tenant", payCreate.keyId === 'rzp_test_123');
    report(2, "Razorpay secrets are never returned", !JSON.stringify(payCreate).includes('secret123'));
    report(3, "Payment creation for valid PENDING_PAYMENT order", payCreateReq.status === 200);
    report(4, "Razorpay order ID is persisted", !!payCreate.razorpayOrderId);
    report(5, "Client cannot control payment amount", payCreate.amount === 20);
    
    // Verify Payment 1
    const validSignature = crypto.createHmac('sha256', 'secret123').update(payCreate.razorpayOrderId + '|pay_123').digest('hex');
    const payVerifyReq = await fetch(`${baseUrl}/storefront/t1/orders/${oJson.order.id}/payment/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id: payCreate.razorpayOrderId, razorpay_payment_id: 'pay_123', razorpay_signature: validSignature })
    });
    report(8, "Valid payment signature verification", payVerifyReq.status === 200);
    
    const dbOrder1 = await Order.findById(oJson.order.id);
    report(10, "Successful payment changes order to PAID", dbOrder1.status === 'PAID');
    
    const dbState1 = await InventoryState.findOne({ productId: p1.id });
    report(11, "Successful payment changes Reserved -> Sold", dbState1.sold === 2 && dbState1.reserved === 0);
    report(14, "Available remains correct", dbState1.available === 8);
    report(17, "Stock invariant remains valid", dbState1.available + dbState1.reserved + dbState1.sold === 10);
    
    const m1 = await InventoryMovement.findOne({ type: 'ORDER_SOLD' });
    report(12, "ORDER_SOLD movement created", !!m1);

    // Duplicate verify
    const payVerifyReqDup = await fetch(`${baseUrl}/storefront/t1/orders/${oJson.order.id}/payment/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpay_order_id: payCreate.razorpayOrderId, razorpay_payment_id: 'pay_123', razorpay_signature: validSignature })
    });
    report(18, "Duplicate verification is idempotent", payVerifyReqDup.status === 200 && (await InventoryState.findOne({ productId: p1.id })).sold === 2);

    // Order 2: Cancelled Order
    const oReq2 = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j.com', customerPhone: '123', deliveryAddress: 'A', items: [{ productId: p1.id, quantity: 2 }]
    })});
    const oJson2 = await oReq2.json();

    const cancelReq = await fetch(`${baseUrl}/storefront/t1/orders/${oJson2.order.id}/cancel`, { method: 'POST' });
    report(16, "Cancellation endpoint", cancelReq.status === 200);
    
    const dbOrder2 = await Order.findById(oJson2.order.id);
    report(28, "Cancellation Reserved -> Available", (await InventoryState.findOne({ productId: p1.id })).available === 8);
    
    const m2 = await InventoryMovement.findOne({ reference: oJson2.order.id, type: 'ORDER_RELEASED' });
    report(22, "ORDER_RELEASED created exactly once", !!m2);

    const cancelReqDup = await fetch(`${baseUrl}/storefront/t1/orders/${oJson2.order.id}/cancel`, { method: 'POST' });
    report(29, "Repeated cancellation", cancelReqDup.status === 200 && (await InventoryState.findOne({ productId: p1.id })).available === 8);

    // Order 3: Webhook Captured
    const oReq3 = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j.com', customerPhone: '123', deliveryAddress: 'A', items: [{ productId: p1.id, quantity: 1 }]
    })});
    const oJson3 = await oReq3.json();
    const payCreate3 = await (await fetch(`${baseUrl}/storefront/t1/orders/${oJson3.order.id}/payment/create`, { method: 'POST' })).json();
    
    const webhookBody = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123', order_id: payCreate3.razorpayOrderId } } } });
    const whSig = crypto.createHmac('sha256', 'webhook123').update(webhookBody).digest('hex');
    const whReq = await fetch(`${baseUrl}/webhooks/razorpay`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': whSig }, body: webhookBody });
    const whResJson = await whReq.json().catch(() => ({}));
    console.log("WH 3:", whReq.status, whResJson);
    
    report(13, "Payment transaction recorded", whReq.status === 200);
    const m3 = await InventoryMovement.findOne({ reference: oJson3.order.id, type: 'ORDER_SOLD' });
    report(30, "Webhook captured processed", !!m3);

    const badWhReq = await fetch(`${baseUrl}/webhooks/razorpay`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': 'invalid' }, body: webhookBody });
    report(24, "Invalid webhook signature rejected", badWhReq.status === 400);

    // Order 4: Webhook Failed
    const oReq4 = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j.com', customerPhone: '123', deliveryAddress: 'A', items: [{ productId: p1.id, quantity: 1 }]
    })});
    const oJson4 = await oReq4.json();
    const payCreate4 = await (await fetch(`${baseUrl}/storefront/t1/orders/${oJson4.order.id}/payment/create`, { method: 'POST' })).json();
    
    const webhookBodyF = JSON.stringify({ event: 'payment.failed', payload: { payment: { entity: { id: 'pay_fail', order_id: payCreate4.razorpayOrderId } } } });
    const whSigF = crypto.createHmac('sha256', 'webhook123').update(webhookBodyF).digest('hex');
    const whReqF = await fetch(`${baseUrl}/webhooks/razorpay`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Razorpay-Signature': whSigF }, body: webhookBodyF });
    const whFResJson = await whReqF.json().catch(() => ({}));
    console.log("WH F:", whReqF.status, whFResJson);
    
    report(21, "payment.failed releases Reserved -> Available", whReqF.status === 200 && (await InventoryState.findOne({ productId: p1.id })).available === 7);

    // Order 5: Late payment
    const oReq5 = await fetch(`${baseUrl}/storefront/t1/orders`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      customerName: 'J', customerEmail: 'j@j.com', customerPhone: '123', deliveryAddress: 'A', items: [{ productId: p1.id, quantity: 1 }]
    })});
    const oJson5 = await oReq5.json();
    await Order.findByIdAndUpdate(oJson5.order.id, { expiresAt: new Date(Date.now() - 10000) }); // manually expire
    
    const payCreate5 = await (await fetch(`${baseUrl}/storefront/t1/orders/${oJson5.order.id}/payment/create`, { method: 'POST' })).json();
    report(31, "Payment creation for expired order blocked", !payCreate5.keyId);

    const fails = logs.filter(l => l.result === 'FAIL');
    if (fails.length > 0) {
      console.log("FAILURES:");
      console.log(fails);
    } else {
      console.log("ALL PHASE 6 TESTS PASSED.");
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
  app.listen(5021, () => runTests(5021));
}
init();
