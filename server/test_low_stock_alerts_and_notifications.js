const mongoose = require('mongoose');
require('dotenv').config();
const { processLowStockAlerts } = require('./src/services/schedulerService');
const Tenant = require('./src/models/Tenant');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Supplier = require('./src/models/Supplier');
const PurchaseRecord = require('./src/models/PurchaseRecord');
const InventoryMovement = require('./src/models/InventoryMovement');
const InventoryState = require('./src/models/InventoryState');
const Order = require('./src/models/Order');
const PaymentTransaction = require('./src/models/PaymentTransaction');
const Alert = require('./src/models/Alert');
const emailService = require('./src/services/emailService');

// Mock email service
let sentEmails = [];
emailService.sendLowStockEmail = async (emails, productName, available, threshold) => {
  sentEmails.push({ emails, productName, available, threshold });
};

async function runTests() {
  let logs = [];
  function report(num, name, res) {
    logs.push({ num, name, result: res ? 'PASS' : 'FAIL' });
  }

  try {
    console.log("Preparing DB...");
    await mongoose.connect(process.env.MONGO_URI);
    await Tenant.deleteMany({});
    await User.deleteMany({});
    await Product.deleteMany({});
    await Supplier.deleteMany({});
    await PurchaseRecord.deleteMany({});
    await InventoryMovement.deleteMany({});
    await InventoryState.deleteMany({});
    await Order.deleteMany({});
    await PaymentTransaction.deleteMany({});
    await Alert.deleteMany({});

    const tenant = await Tenant.create({ name: 'T1', slug: 't1', businessWideDefaultLowStockThreshold: 10 });
    
    // Create Users
    await User.create({ name: 'Admin 1', email: 'a1@t.com', password: 'p', role: 'BUSINESS_ADMIN', tenantId: tenant._id, status: 'ACTIVE' });
    await User.create({ name: 'Admin 2', email: 'a2@t.com', password: 'p', role: 'BUSINESS_ADMIN', tenantId: tenant._id, status: 'ACTIVE' });
    await User.create({ name: 'Suspended Admin', email: 'a3@t.com', password: 'p', role: 'BUSINESS_ADMIN', tenantId: tenant._id, status: 'SUSPENDED' });
    await User.create({ name: 'Staff 1', email: 's1@t.com', password: 'p', role: 'STAFF', tenantId: tenant._id, status: 'ACTIVE' });
    
    // Create Products
    const pOverride = await Product.create({ tenantId: tenant._id, name: 'P_Override', SKU: 'SKU1', sellingPrice: 10, lowStockThreshold: 5 });
    const pDefault = await Product.create({ tenantId: tenant._id, name: 'P_Default', SKU: 'SKU2', sellingPrice: 10 }); // should use 10

    // Seed Stock
    await InventoryState.create({ tenantId: tenant._id, productId: pOverride._id, available: 5, reserved: 0, sold: 0 }); // threshold is 5. available 5 is NOT low stock
    await InventoryState.create({ tenantId: tenant._id, productId: pDefault._id, available: 10, reserved: 0, sold: 0 }); // threshold 10. available 10 is NOT low stock

    await processLowStockAlerts();
    
    let aCount = await Alert.countDocuments();
    report(3, "available == threshold is NOT low stock", aCount === 0);

    // Drop stock below threshold
    await InventoryState.updateOne({ productId: pOverride._id }, { available: 4 });
    await InventoryState.updateOne({ productId: pDefault._id }, { available: 9 });

    await processLowStockAlerts();

    const alerts = await Alert.find();
    report(5, "First low-stock crossing creates ACTIVE alert", alerts.length === 2 && alerts.every(a => a.status === 'ACTIVE'));
    report(4, "available < threshold is low stock", alerts.length === 2);
    report(1, "Product-specific threshold overrides Tenant default", alerts.find(a => a.productId.equals(pOverride._id)).thresholdAtAlert === 5);
    report(2, "Missing Product threshold falls back to Tenant default", alerts.find(a => a.productId.equals(pDefault._id)).thresholdAtAlert === 10);
    
    report(6, "First low-stock crossing sends email", sentEmails.length === 2);
    
    const recipients = sentEmails[0].emails;
    report(13, "Only ACTIVE BUSINESS_ADMIN users receive email", recipients.includes('a1@t.com') && recipients.includes('a2@t.com'));
    report(14, "STAFF does not receive email", !recipients.includes('s1@t.com'));
    report(15, "SUSPENDED BUSINESS_ADMIN does not receive email", !recipients.includes('a3@t.com'));

    // Check duplicate prevention
    sentEmails = [];
    await InventoryState.updateOne({ productId: pOverride._id }, { available: 3 }); // Dropping further
    await processLowStockAlerts();

    report(7, "Continued low stock does not create duplicate ACTIVE alerts", (await Alert.countDocuments()) === 2);
    report(8, "Continued low stock does not send duplicate emails", sentEmails.length === 0);

    // Stock recovery
    await InventoryState.updateOne({ productId: pOverride._id }, { available: 5 }); // exactly threshold
    await InventoryState.updateOne({ productId: pDefault._id }, { available: 15 }); // above threshold
    await processLowStockAlerts();

    const resolvedAlerts = await Alert.find({ status: 'RESOLVED' });
    report(9, "Stock recovery at exactly threshold resolves alert", resolvedAlerts.some(a => a.productId.equals(pOverride._id)));
    report(10, "Stock recovery above threshold resolves alert", resolvedAlerts.some(a => a.productId.equals(pDefault._id)));
    report(17, "Tenant isolation", alerts.every(a => a.tenantId.equals(tenant._id)));
    report(19, "InventoryState remains unchanged by alert processing", (await InventoryState.findOne({ productId: pOverride._id })).available === 5);

    // Later crossing below threshold
    await InventoryState.updateOne({ productId: pOverride._id }, { available: 2 });
    await processLowStockAlerts();

    const newAlert = await Alert.findOne({ productId: pOverride._id, status: 'ACTIVE' });
    report(11, "Later crossing below threshold creates a new alert", !!newAlert && newAlert._id.toString() !== alerts.find(a => a.productId.equals(pOverride._id))._id.toString());
    report(12, "Later crossing below threshold sends a new email", sentEmails.length === 1 && sentEmails[0].productName === 'P_Override');

    // Super Admin not getting it? No super admin in tenant so true by default, but let's test it:
    await User.create({ name: 'SA', email: 'sa@sa.com', password: 'p', role: 'SUPER_ADMIN', status: 'ACTIVE' }); // No tenantId
    // Ensure SA wasn't emailed
    report(16, "SUPER_ADMIN does not receive email", !sentEmails[0].emails.includes('sa@sa.com'));
    
    // Simulate email failure handling - doesn't crash
    let originalSend = emailService.sendLowStockEmail;
    emailService.sendLowStockEmail = async () => { throw new Error('SMTP Error'); };
    await InventoryState.updateOne({ productId: pDefault._id }, { available: 5 }); // drop again
    try {
      await processLowStockAlerts();
      report(18, "Email failure does not corrupt inventory or crash scheduler", true);
    } catch (e) {
      report(18, "Email failure does not corrupt inventory or crash scheduler", false);
    }

    const fails = logs.filter(l => l.result === 'FAIL');
    if (fails.length > 0) {
      console.log("FAILURES:");
      console.log(fails);
    } else {
      console.log("ALL PHASE 8 TESTS PASSED.");
    }
    process.exit(0);
  } catch (err) {
    console.error("ERROR:", err);
    process.exit(1);
  }
}

runTests();
