const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Supplier = require('./src/models/Supplier');
const PurchaseRecord = require('./src/models/PurchaseRecord');

const ARTIFACT_DIR = 'C:\\Users\\avniv\\.gemini\\antigravity\\brain\\57c15555-8bc1-4959-bf64-56ef3eba9d2c';
const CLIENT_QA_DIR = path.resolve(__dirname, '../client/qa-screenshots');

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const user = await User.findOne({ role: 'BUSINESS_ADMIN' });
  if (!user) {
    console.error('No BUSINESS_ADMIN user found');
    process.exit(1);
  }

  const product = await Product.findOne({ tenantId: user.tenantId });
  if (!product) {
    console.error('No product found for tenant');
    process.exit(1);
  }

  // Create temporary test records for accurate screenshot depiction
  let tempSupplier = null;
  let tempPurchase = null;

  try {
    tempSupplier = await Supplier.create({
      tenantId: user.tenantId,
      name: 'Apex Logistics & Distribution',
      contactName: 'Eleanor Vance',
      email: 'orders@apexlogistics.com',
      phone: '+1 (555) 349-2041',
      address: '742 Evergreen Terrace, Sector 4, Springfield',
      status: 'ACTIVE'
    });
    console.log('Created temporary test supplier:', tempSupplier._id.toString());

    tempPurchase = await PurchaseRecord.create({
      tenantId: user.tenantId,
      supplierId: tempSupplier._id,
      items: [{
        productId: product._id,
        quantity: 20,
        purchasePrice: 35.00
      }],
      status: 'PENDING'
    });
    console.log('Created temporary test purchase:', tempPurchase._id.toString());

    const token = jwt.sign(
      { id: user._id, role: user.role, tenantId: user.tenantId },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    async function setupAuth(theme = 'dark') {
      await page.evaluate((tok, usr, thm) => {
        localStorage.setItem('stockflow_token', tok);
        localStorage.setItem('stockflow_user', JSON.stringify({
          id: usr._id,
          name: usr.name,
          email: usr.email,
          role: usr.role,
          tenantId: usr.tenantId
        }));
        localStorage.setItem('stockflow_theme', thm);
        document.documentElement.setAttribute('data-theme', thm);
      }, token, user, theme);
    }

    async function saveScreenshot(filename) {
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      const clientPath = path.join(CLIENT_QA_DIR, filename);
      await page.screenshot({ path: artifactPath });
      try {
        fs.copyFileSync(artifactPath, clientPath);
      } catch (e) {
        console.warn('Could not copy to client qa folder:', e.message);
      }
      console.log(`Saved: ${filename}`);
    }

    const pagesToCapture = [
      { name: 'inventory', url: 'http://localhost:5173/inventory' },
      { name: 'purchase_list', url: 'http://localhost:5173/purchases' },
      { name: 'purchase_create', url: 'http://localhost:5173/purchases/new' },
      { name: 'purchase_details', url: `http://localhost:5173/purchases/${tempPurchase._id}` },
      { name: 'supplier_list', url: 'http://localhost:5173/suppliers' },
      { name: 'supplier_create', url: 'http://localhost:5173/suppliers/new' },
      { name: 'supplier_details', url: `http://localhost:5173/suppliers/${tempSupplier._id}` },
      { name: 'supplier_edit', url: `http://localhost:5173/suppliers/${tempSupplier._id}/edit` }
    ];

    // --- 1. DESKTOP VIEWPORT (1440x900) ---
    console.log('\n--- Capturing Desktop Viewports (1440x900) ---');
    await page.setViewport({ width: 1440, height: 900 });

    for (const item of pagesToCapture) {
      // Dark
      await page.goto(item.url, { waitUntil: 'networkidle2' });
      await setupAuth('dark');
      await page.goto(item.url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 800));
      await saveScreenshot(`desktop_${item.name}_dark.png`);

      // Light
      await setupAuth('light');
      await new Promise(r => setTimeout(r, 600));
      await saveScreenshot(`desktop_${item.name}_light.png`);
    }

    // --- 2. MOBILE VIEWPORT (390x844) ---
    console.log('\n--- Capturing Mobile Viewports (390x844) ---');
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

    for (const item of pagesToCapture) {
      // Dark
      await page.goto(item.url, { waitUntil: 'networkidle2' });
      await setupAuth('dark');
      await page.goto(item.url, { waitUntil: 'networkidle2' });
      await new Promise(r => setTimeout(r, 800));
      await saveScreenshot(`mobile_${item.name}_dark.png`);

      // Light
      await setupAuth('light');
      await new Promise(r => setTimeout(r, 600));
      await saveScreenshot(`mobile_${item.name}_light.png`);
    }

    await browser.close();
    console.log('\nAll Checkpoint 5 screenshots captured successfully!');

  } finally {
    // Delete temporary test records immediately to maintain data integrity
    if (tempPurchase) {
      await PurchaseRecord.findByIdAndDelete(tempPurchase._id);
      console.log('Cleaned up temporary test purchase record');
    }
    if (tempSupplier) {
      await Supplier.findByIdAndDelete(tempSupplier._id);
      console.log('Cleaned up temporary test supplier record');
    }
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

main().catch(err => {
  console.error('Error during execution:', err);
  process.exit(1);
});
