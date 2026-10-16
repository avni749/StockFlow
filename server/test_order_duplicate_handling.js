const mongoose = require('mongoose');
const { createOrder, cancelOrder, verifyPayment } = require('./src/controllers/storefrontController');
const { processExpiredReservations } = require('./src/services/schedulerService');
const Tenant = require('./src/models/Tenant');
const Product = require('./src/models/Product');
const InventoryState = require('./src/models/InventoryState');
const Order = require('./src/models/Order');
const PaymentTransaction = require('./src/models/PaymentTransaction');
const crypto = require('crypto');
require('dotenv').config();

const delay = ms => new Promise(res => setTimeout(res, ms));

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to DB');

  await Tenant.deleteMany({});
  await Product.deleteMany({});
  await InventoryState.deleteMany({});
  await Order.deleteMany({});
  await PaymentTransaction.deleteMany({});

  const tenant = await Tenant.create({
    name: 'Test Biz',
    slug: 'test-biz',
    status: 'ACTIVE',
    razorpayKeyId: 'test_key',
    razorpayKeySecret: 'test_secret',
    reservationDurationMinutes: 5
  });

  const product1 = await Product.create({
    tenantId: tenant._id,
    name: 'Product 1',
    SKU: 'SKU1',
    sellingPrice: 100,
    status: 'ACTIVE'
  });

  const product2 = await Product.create({
    tenantId: tenant._id,
    name: 'Product 2',
    SKU: 'SKU2',
    sellingPrice: 50,
    status: 'ACTIVE'
  });

  await InventoryState.create([
    { tenantId: tenant._id, productId: product1._id, available: 100, reserved: 0, sold: 0 },
    { tenantId: tenant._id, productId: product2._id, available: 100, reserved: 0, sold: 0 }
  ]);

  // Helper to mock req/res
  const mockReqRes = (body, params) => {
    const req = { body, params };
    const res = {
      status(code) { this.statusCode = code; return this; },
      json(data) { this.data = data; return this; }
    };
    const next = (err) => { res.error = err; };
    return { req, res, next };
  };

  const getInv = async (pid) => {
    const s = await InventoryState.findOne({ productId: pid });
    return { available: s.available, reserved: s.reserved, sold: s.sold };
  };

  console.log('\n--- Test 1: Normal order ---');
  let { req, res, next } = mockReqRes(
    { customerName: 'A', customerEmail: 'a@a', customerPhone: '1', deliveryAddress: 'A', items: [{ productId: product1._id, quantity: 5 }] },
    { slug: 'test-biz' }
  );
  await createOrder(req, res, next);
  let inv1 = await getInv(product1._id);
  console.log('Normal Order Res:', res.data.message);
  console.log(`Product 1 Stock (expected a:95, r:5, s:0): a:${inv1.available}, r:${inv1.reserved}, s:${inv1.sold}`);

  console.log('\n--- Test 2: Duplicate ProductIds in Order ---');
  ({ req, res, next } = mockReqRes(
    { customerName: 'B', customerEmail: 'b@b', customerPhone: '2', deliveryAddress: 'B', items: [{ productId: product2._id, quantity: 2 }, { productId: product2._id, quantity: 3 }] },
    { slug: 'test-biz' }
  ));
  await createOrder(req, res, next);
  const dupOrderId = res.data.order.id;
  let inv2 = await getInv(product2._id);
  console.log('Duplicate Order Res:', res.data.message);
  console.log(`Product 2 Stock (expected a:95, r:5, s:0): a:${inv2.available}, r:${inv2.reserved}, s:${inv2.sold}`);

  console.log('\n--- Test 3: Cancelling Duplicate Order ---');
  ({ req, res, next } = mockReqRes({}, { slug: 'test-biz', orderId: dupOrderId }));
  await cancelOrder(req, res, next);
  inv2 = await getInv(product2._id);
  console.log('Cancel Duplicate Order Res:', res.data.message);
  console.log(`Product 2 Stock (expected a:100, r:0, s:0): a:${inv2.available}, r:${inv2.reserved}, s:${inv2.sold}`);

  console.log('\n--- Test 4: Expiring an Order ---');
  ({ req, res, next } = mockReqRes(
    { customerName: 'C', customerEmail: 'c@c', customerPhone: '3', deliveryAddress: 'C', items: [{ productId: product1._id, quantity: 10 }] },
    { slug: 'test-biz' }
  ));
  await createOrder(req, res, next);
  const expOrderId = res.data.order.id;
  inv1 = await getInv(product1._id);
  console.log(`After create: Product 1 Stock: a:${inv1.available}, r:${inv1.reserved}`);
  
  // Backdate expiry
  await Order.updateOne({ _id: expOrderId }, { expiresAt: new Date(Date.now() - 100000) });
  await processExpiredReservations();
  inv1 = await getInv(product1._id);
  console.log(`After expiry: Product 1 Stock (expected a:95, r:5, s:0): a:${inv1.available}, r:${inv1.reserved}, s:${inv1.sold}`);

  console.log('\n--- Test 5: Successful Payment ---');
  ({ req, res, next } = mockReqRes(
    { customerName: 'D', customerEmail: 'd@d', customerPhone: '4', deliveryAddress: 'D', items: [{ productId: product2._id, quantity: 20 }] },
    { slug: 'test-biz' }
  ));
  await createOrder(req, res, next);
  const payOrderId = res.data.order.id;
  
  // mock PaymentTransaction
  await PaymentTransaction.create({ tenantId: tenant._id, orderId: payOrderId, razorpayOrderId: 'rzp_123', amount: 1000, currency: 'INR', status: 'CREATED' });
  
  const signature = crypto.createHmac('sha256', tenant.razorpayKeySecret).update('rzp_123|pay_123').digest('hex');
  ({ req, res, next } = mockReqRes({ razorpay_order_id: 'rzp_123', razorpay_payment_id: 'pay_123', razorpay_signature: signature }, { slug: 'test-biz' }));
  await verifyPayment(req, res, next);
  
  inv2 = await getInv(product2._id);
  console.log('Payment Res:', res.data.message);
  console.log(`Product 2 Stock (expected a:80, r:0, s:20): a:${inv2.available}, r:${inv2.reserved}, s:${inv2.sold}`);

  console.log('\n--- Final Math Check ---');
  const allStates = await InventoryState.find();
  let consistent = true;
  for (const s of allStates) {
    if (s.available < 0 || s.reserved < 0 || s.sold < 0) consistent = false;
  }
  console.log('All quantities >= 0:', consistent);

  process.exit(0);
}

run();
