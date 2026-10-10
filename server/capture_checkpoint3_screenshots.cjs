const puppeteer = require('puppeteer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const User = require('./src/models/User');

const ARTIFACT_DIR = 'C:\\Users\\avniv\\.gemini\\antigravity\\brain\\57c15555-8bc1-4959-bf64-56ef3eba9d2c';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ role: 'BUSINESS_ADMIN' });
  if (!user) {
    console.error('No BUSINESS_ADMIN user found');
    process.exit(1);
  }

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

  // Helper to set auth state
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

  // --- DESKTOP 1440px ---
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Dashboard Desktop Dark
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await setupAuth('dark');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_dashboard_dark.png') });
  console.log('Saved desktop_dashboard_dark.png');

  // 2. Dashboard Desktop Light
  await setupAuth('light');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_dashboard_light.png') });
  console.log('Saved desktop_dashboard_light.png');

  // 3. Products Desktop Dark
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_products_dark.png') });
  console.log('Saved desktop_products_dark.png');

  // 4. Products Desktop Light
  await setupAuth('light');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'desktop_products_light.png') });
  console.log('Saved desktop_products_light.png');

  // --- MOBILE 390px (iPhone 14/15 size) ---
  await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });

  // 5. Dashboard Mobile Dark
  await setupAuth('dark');
  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_dashboard_dark.png') });
  console.log('Saved mobile_dashboard_dark.png');

  // 6. Dashboard Mobile Light
  await setupAuth('light');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_dashboard_light.png') });
  console.log('Saved mobile_dashboard_light.png');

  // 7. Products Mobile Dark
  await setupAuth('dark');
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_products_dark.png') });
  console.log('Saved mobile_products_dark.png');

  // 8. Products Mobile Light
  await setupAuth('light');
  await new Promise(r => setTimeout(r, 800));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'mobile_products_light.png') });
  console.log('Saved mobile_products_light.png');

  await browser.close();
  await mongoose.disconnect();
  console.log('All desktop and mobile screenshots captured!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
