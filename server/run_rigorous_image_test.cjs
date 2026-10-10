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

  const tenantId = user.tenantId;

  // 1. Create 3 temporary products
  const SKUS = ['TEST-IMG-VALID', 'TEST-IMG-NONE', 'TEST-IMG-BROKEN'];
  await Product.deleteMany({ SKU: { $in: SKUS } });

  const validUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=300&q=80';
  const brokenUrl = 'https://images.unsplash.com/photo-00000000-nonexistent-404.jpg';

  const pValid = await Product.create({
    name: 'Test Product (Valid Image 200)',
    SKU: 'TEST-IMG-VALID',
    sellingPrice: 199.99,
    category: 'QA-Testing',
    image: validUrl,
    tenantId,
    status: 'ACTIVE'
  });

  const pNone = await Product.create({
    name: 'Test Product (Missing Image)',
    SKU: 'TEST-IMG-NONE',
    sellingPrice: 89.50,
    category: 'QA-Testing',
    image: '',
    tenantId,
    status: 'ACTIVE'
  });

  const pBroken = await Product.create({
    name: 'Test Product (Broken 404 Image)',
    SKU: 'TEST-IMG-BROKEN',
    sellingPrice: 45.00,
    category: 'QA-Testing',
    image: brokenUrl,
    tenantId,
    status: 'ACTIVE'
  });

  console.log('Created 3 temporary test products.');

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

  // Track image network responses
  const imageNetworkResponses = {};
  page.on('response', response => {
    const url = response.url();
    if (url.includes('unsplash.com')) {
      imageNetworkResponses[url] = response.status();
    }
  });

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

  await page.setViewport({ width: 1440, height: 900 });

  // Load products page
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1500));

  // Inspect the three rows in dark mode
  const inspectRows = async (themeName) => {
    return await page.evaluate((skus) => {
      const results = {};
      const rows = Array.from(document.querySelectorAll('table.data-table tbody tr'));

      for (const sku of skus) {
        const row = rows.find(r => r.innerText.includes(sku));
        if (!row) {
          results[sku] = { found: false };
          continue;
        }

        const rect = row.getBoundingClientRect();
        const thumbContainer = row.querySelector('.product-thumbnail, .product-thumbnail-placeholder');
        const thumbRect = thumbContainer ? thumbContainer.getBoundingClientRect() : null;
        const img = row.querySelector('img');
        const svg = row.querySelector('svg');

        let imgComputed = null;
        if (img) {
          const style = window.getComputedStyle(img);
          imgComputed = {
            objectFit: style.objectFit,
            width: style.width,
            height: style.height,
            display: style.display,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            complete: img.complete
          };
        }

        results[sku] = {
          found: true,
          rowHeight: Math.round(rect.height),
          thumbWidth: thumbRect ? Math.round(thumbRect.width) : null,
          thumbHeight: thumbRect ? Math.round(thumbRect.height) : null,
          hasImgTag: !!img,
          hasSvgPlaceholder: !!svg,
          imgComputed
        };
      }
      return results;
    }, SKUS);
  };

  const darkMetrics = await inspectRows('dark');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'image_test_products_dark.png') });

  // Light theme
  await setupAuth('light');
  await new Promise(r => setTimeout(r, 800));
  const lightMetrics = await inspectRows('light');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'image_test_products_light.png') });

  // Clean up test products from DB
  await Product.deleteMany({ SKU: { $in: SKUS } });
  console.log('Cleaned up 3 temporary test products from database.');

  await browser.close();
  await mongoose.disconnect();

  console.log('\n=== IMAGE TEST EXECUTION REPORT ===');
  console.log('Image Network Responses:', JSON.stringify(imageNetworkResponses, null, 2));
  console.log('\nDark Theme Metrics:', JSON.stringify(darkMetrics, null, 2));
  console.log('\nLight Theme Metrics:', JSON.stringify(lightMetrics, null, 2));
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
