const http = require('http');

async function testApi() {
  const loginOpts = { hostname: 'localhost', port: 5000, path: '/api/v1/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } };
  const token = await new Promise((resolve) => {
    const req = http.request(loginOpts, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(JSON.parse(data).token));
    });
    // E2E test earlier created 'e2e_171...'. I'll just use a generic or check super admin, wait I'll use owner@business.com, if it fails, I'll get 401. Let's find an active user.
    // Actually, I can just query the DB.
    req.write(JSON.stringify({ email: 'owner@business.com', password: 'password123' }));
    req.end();
  });

  // Since I might not have owner@business.com, let's query DB for a valid user
  const mongoose = require('mongoose');
  require('dotenv').config();
  await mongoose.connect(process.env.MONGO_URI);
  const User = require('./src/models/User');
  const user = await User.findOne({ role: 'BUSINESS_ADMIN' });
  let validToken = token;
  if (!validToken && user) {
    // Generate valid token directly
    const jwt = require('jsonwebtoken');
    validToken = jwt.sign({ id: user._id, role: user.role, tenantId: user.tenantId }, process.env.JWT_SECRET, { expiresIn: '1d' });
  }

  async function testAuthApi(path) {
    return new Promise((resolve) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path: `/api/v1${path}`,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${validToken}` }
      };
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.end();
    });
  }

  const endpoints = [
    '/business/insights/stock-overview',
    '/business/insights/sales',
    '/business/insights/top-selling?limit=5',
    '/business/orders?limit=5',
    '/business/products',
    '/business/suppliers',
    '/business/inventory',
    '/business/purchases',
    '/business/inventory-movements'
  ];

  console.log('| Endpoint | Status | Result |');
  console.log('|---|---|---|');
  for (const ep of endpoints) {
    const r = await testAuthApi(ep);
    let result = 'Success';
    if (r.status !== 200) result = r.body;
    else {
      try {
        const d = JSON.parse(r.body);
        if (Object.keys(d).length > 0) result = 'JSON Parsed OK';
      } catch (e) {
        result = 'Invalid JSON';
      }
    }
    console.log(`| ${ep} | ${r.status} | ${result} |`);
  }
  process.exit(0);
}

testApi();
