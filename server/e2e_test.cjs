const http = require('http');

const runTest = async () => {
  const loginPayload = JSON.stringify({ email: 'owner@business.com', password: 'password123' });
  const reqOpts = (path, method, token, payload) => {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: 5000,
        path,
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: JSON.parse(data) });
          } catch(e) {
            resolve({ status: res.statusCode, data });
          }
        });
      });
      req.on('error', reject);
      if (payload) req.write(payload);
      req.end();
    });
  };

  try {
    const ts = Date.now();
    const adminEmail = `e2e_${ts}@test.com`;
    const tenantSlug = `e2estore_${ts}`;
    
    console.log('[E2E] 1. Registering Business...');
    const regPayload = JSON.stringify({ name: 'E2E Admin', email: adminEmail, password: 'password123', businessName: 'E2E Business', slug: tenantSlug });
    const regRes = await reqOpts('/api/v1/auth/register', 'POST', null, regPayload);
    if (regRes.status !== 201) throw new Error('Registration failed: ' + JSON.stringify(regRes.data));

    console.log('[E2E] 2. Logging in...');
    const loginPayload = JSON.stringify({ email: adminEmail, password: 'password123' });
    const loginRes = await reqOpts('/api/v1/auth/login', 'POST', null, loginPayload);
    if (loginRes.status !== 200) throw new Error('Login failed: ' + JSON.stringify(loginRes.data));
    const token = loginRes.data.token;
    console.log('[E2E] - Success. Token acquired.');

    console.log('[E2E] 2. Creating Product...');
    const prodPayload = JSON.stringify({ name: 'E2E Test Widget', SKU: `WIDGET-${Date.now()}`, sellingPrice: 25.00, category: 'E2E' });
    const prodRes = await reqOpts('/api/v1/business/products', 'POST', token, prodPayload);
    if (prodRes.status !== 201) throw new Error('Product creation failed: ' + JSON.stringify(prodRes.data));
    const productId = prodRes.data.product.id;
    console.log(`[E2E] - Success. Product ID: ${productId}`);

    console.log('[E2E] 3. Creating Supplier...');
    const supPayload = JSON.stringify({ name: 'E2E Supplier', email: 'sup@test.com', phone: '1234567890' });
    const supRes = await reqOpts('/api/v1/business/suppliers', 'POST', token, supPayload);
    if (supRes.status !== 201) throw new Error('Supplier creation failed: ' + JSON.stringify(supRes.data));
    const supplierId = supRes.data.supplier.id;
    console.log(`[E2E] - Success. Supplier ID: ${supplierId}`);

    console.log('[E2E] 4. Creating Purchase...');
    const purchPayload = JSON.stringify({ supplierId, items: [{ productId, quantity: 50, purchasePrice: 10.00 }] });
    const purchRes = await reqOpts('/api/v1/business/purchases', 'POST', token, purchPayload);
    if (purchRes.status !== 201) throw new Error('Purchase creation failed: ' + JSON.stringify(purchRes.data));
    const purchaseId = purchRes.data.purchase.id;
    console.log(`[E2E] - Success. Purchase ID: ${purchaseId}`);

    console.log('[E2E] 5. Receiving Purchase (Increasing Stock)...');
    const recvRes = await reqOpts(`/api/v1/business/purchases/${purchaseId}/receive`, 'POST', token);
    if (recvRes.status !== 200) throw new Error('Purchase receive failed: ' + JSON.stringify(recvRes.data));
    console.log('[E2E] - Success. Stock Added.');

    console.log('[E2E] 6. Verifying Inventory State...');
    const invRes = await reqOpts('/api/v1/business/inventory', 'GET', token);
    const productInv = invRes.data.inventory.find(i => i.product.id === productId);
    if (!productInv || productInv.available !== 50) {
      throw new Error('Inventory mismatch: ' + JSON.stringify(productInv));
    }
    console.log('[E2E] - Success. Available: 50');

    console.log('[E2E] 7. Creating Storefront Order (Reserving Stock)...');
    const orderPayload = JSON.stringify({
      customerName: 'E2E Shopper',
      customerEmail: 'shopper@test.com',
      customerPhone: '5551234567',
      deliveryAddress: '123 Ave, City, State 12345, US',
      items: [{ productId, quantity: 5 }]
    });

    const orderRes = await reqOpts(`/api/v1/storefront/${tenantSlug}/orders`, 'POST', null, orderPayload);
    if (orderRes.status !== 201) throw new Error('Order creation failed: ' + JSON.stringify(orderRes.data));
    const orderId = orderRes.data.order.id;
    console.log(`[E2E] - Success. Storefront Order ID: ${orderId}`);

    console.log('[E2E] 8. Re-Verifying Inventory State (Checking Reservation)...');
    const invRes2 = await reqOpts('/api/v1/business/inventory', 'GET', token);
    const productInv2 = invRes2.data.inventory.find(i => i.product.id === productId);
    if (!productInv2 || productInv2.available !== 45 || productInv2.reserved !== 5) {
      throw new Error('Inventory reservation failed: ' + JSON.stringify(productInv2));
    }
    console.log('[E2E] - Success. Available: 45, Reserved: 5.');
    
    console.log('[E2E] 9. Checking Razorpay configuration blocker (Expected Behavior without Keys)...');
    const payRes = await reqOpts(`/api/v1/storefront/${tenantSlug}/orders/${orderId}/payment/create`, 'POST', null);
    if (payRes.status === 400 && payRes.data.message.includes('Razorpay is not configured')) {
      console.log(`[E2E] - Success. Expected Razorpay configuration block triggered.`);
    } else {
      console.warn('[E2E] - Unexpected payment creation behavior: ', payRes.status, payRes.data);
    }

    console.log('\n✅ ALL E2E LIFECYCLE TESTS PASSED SUCCESSFULLY.');
  } catch (e) {
    console.error('\n❌ E2E TEST FAILED:', e);
  }
};

runTest();
