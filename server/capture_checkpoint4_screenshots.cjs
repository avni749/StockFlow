const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const User = require('./src/models/User');
const Product = require('./src/models/Product');

const ARTIFACT_DIR = 'C:\\Users\\avniv\\.gemini\\antigravity\\brain\\57c15555-8bc1-4959-bf64-56ef3eba9d2c';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
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

  const productId = product._id.toString();
  console.log(`Using product ID: ${productId} (${product.name})`);

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

  // --- 1. DESKTOP 1440px ---
  await page.setViewport({ width: 1440, height: 900 });

  // A. Products List
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_list_dark.png') });
  console.log('Saved desktop_product_list_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_list_light.png') });
  console.log('Saved desktop_product_list_light.png');

  // B. Product Create (with live image preview demonstration)
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products/new', { waitUntil: 'networkidle2' });
  await page.type('input[name="image"]', 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300');
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_create_dark.png') });
  console.log('Saved desktop_product_create_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_create_light.png') });
  console.log('Saved desktop_product_create_light.png');

  // C. Product Details
  await setupAuth('dark');
  await page.goto(`http://localhost:5173/products/${productId}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_details_dark.png') });
  console.log('Saved desktop_product_details_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_details_light.png') });
  console.log('Saved desktop_product_details_light.png');

  // D. Product Edit
  await setupAuth('dark');
  await page.goto(`http://localhost:5173/products/${productId}/edit`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_edit_dark.png') });
  console.log('Saved desktop_product_edit_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_product_edit_light.png') });
  console.log('Saved desktop_product_edit_light.png');

  // --- 2. MOBILE 390px ---
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // A. Product List Mobile
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_list_dark.png') });
  console.log('Saved mobile_product_list_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_list_light.png') });
  console.log('Saved mobile_product_list_light.png');

  // B. Product Create Mobile
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products/new', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_create_dark.png') });
  console.log('Saved mobile_product_create_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_create_light.png') });
  console.log('Saved mobile_product_create_light.png');

  // C. Product Details Mobile
  await setupAuth('dark');
  await page.goto(`http://localhost:5173/products/${productId}`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_details_dark.png') });
  console.log('Saved mobile_product_details_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_details_light.png') });
  console.log('Saved mobile_product_details_light.png');

  // D. Product Edit Mobile
  await setupAuth('dark');
  await page.goto(`http://localhost:5173/products/${productId}/edit`, { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1000));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_edit_dark.png') });
  console.log('Saved mobile_product_edit_dark.png');

  await setupAuth('light');
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_product_edit_light.png') });
  console.log('Saved mobile_product_edit_light.png');

  await browser.close();
  await mongoose.disconnect();
  console.log('All Checkpoint 4 screenshots captured successfully!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
