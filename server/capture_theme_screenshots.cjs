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
  await page.setViewport({ width: 1440, height: 900 });

  // 1. Capture Landing Page (Dark Theme)
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle2' });
  await page.evaluate(() => {
    localStorage.setItem('stockflow_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_dark_theme.png') });
  console.log('Saved landing_dark_theme.png');

  // 2. Capture Landing Page (Light Theme)
  await page.evaluate(() => {
    localStorage.setItem('stockflow_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 600));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'landing_light_theme.png') });
  console.log('Saved landing_light_theme.png');

  // 3. Authenticate and capture Dashboard (Dark Theme)
  await page.evaluate((tok, usr) => {
    localStorage.setItem('stockflow_token', tok);
    localStorage.setItem('stockflow_user', JSON.stringify({
      id: usr._id,
      name: usr.name,
      email: usr.email,
      role: usr.role,
      tenantId: usr.tenantId
    }));
    localStorage.setItem('stockflow_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  }, token, user);

  await page.goto('http://localhost:5173/dashboard', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_dark_theme.png') });
  console.log('Saved dashboard_dark_theme.png');

  // 4. Capture Dashboard (Light Theme)
  await page.evaluate(() => {
    localStorage.setItem('stockflow_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'dashboard_light_theme.png') });
  console.log('Saved dashboard_light_theme.png');

  // 5. Capture Products Table (Dark Theme)
  await page.evaluate(() => {
    localStorage.setItem('stockflow_theme', 'dark');
    document.documentElement.setAttribute('data-theme', 'dark');
  });
  await page.goto('http://localhost:5173/products', { waitUntil: 'networkidle2' });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'products_dark_theme.png') });
  console.log('Saved products_dark_theme.png');

  // 6. Capture Products Table (Light Theme)
  await page.evaluate(() => {
    localStorage.setItem('stockflow_theme', 'light');
    document.documentElement.setAttribute('data-theme', 'light');
  });
  await new Promise(r => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'products_light_theme.png') });
  console.log('Saved products_light_theme.png');

  await browser.close();
  await mongoose.disconnect();
  console.log('All screenshots captured successfully!');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
