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

  async function setContext(theme, isAuth = false) {
    await page.evaluate((thm, tok, usr, authed) => {
      localStorage.setItem('stockflow_theme', thm);
      document.documentElement.setAttribute('data-theme', thm);
      if (authed) {
        localStorage.setItem('stockflow_token', tok);
        localStorage.setItem('stockflow_user', JSON.stringify({
          id: usr._id,
          name: usr.name,
          email: usr.email,
          role: usr.role,
          tenantId: usr.tenantId
        }));
      } else {
        localStorage.removeItem('stockflow_token');
        localStorage.removeItem('stockflow_user');
      }
    }, theme, token, user, isAuth);
  }

  const targets = [
    { name: 'landing', path: '/', isAuth: false },
    { name: 'login', path: '/login', isAuth: false },
    { name: 'register', path: '/register', isAuth: false },
    { name: 'dashboard', path: '/dashboard', isAuth: true },
  ];

  const viewports = [
    { label: 'desktop', width: 1440, height: 900, isMobile: false },
    { label: 'mobile', width: 390, height: 844, isMobile: true }
  ];

  const themes = ['dark', 'light'];

  for (const vp of viewports) {
    await page.setViewport({ width: vp.width, height: vp.height, isMobile: vp.isMobile, hasTouch: vp.isMobile });

    for (const t of targets) {
      for (const thm of themes) {
        // Navigate
        await page.goto(`http://localhost:5173${t.path}`, { waitUntil: 'networkidle2' });
        await setContext(thm, t.isAuth);
        await page.goto(`http://localhost:5173${t.path}`, { waitUntil: 'networkidle2' });
        await new Promise(r => setTimeout(r, 600));

        const fileName = `${vp.label}_${t.name}_${thm}.png`;
        const filePath = path.join(ARTIFACT_DIR, fileName);
        await page.screenshot({ path: filePath, fullPage: false });
        console.log(`Saved: ${fileName}`);
      }
    }
  }

  await browser.close();
  await mongoose.disconnect();
  console.log('COMPLETE: All 16 screenshots saved successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
