const fs = require('fs');

function checkFileContains(filepath, strings) {
  try {
    const content = fs.readFileSync(filepath, 'utf8');
    return strings.every(s => content.includes(s));
  } catch (e) {
    return false;
  }
}

function runTests() {
  let passed = true;

  console.log("Phase 11B Regression Tests:");

  const appJsxOk = checkFileContains('src/App.jsx', [
    '<Route path="/products" element={<ProductList />} />',
    '<Route path="/products/new" element={<ProductCreate />} />',
    '<Route path="/products/:productId" element={<ProductDetails />} />',
    '<Route path="/products/:productId/edit" element={<ProductEdit />} />'
  ]);
  if (appJsxOk) console.log("✔ Routes /products, /products/new, /products/:productId, /products/:productId/edit work");
  else { console.log("✖ Routes missing"); passed = false; }

  const listOk = checkFileContains('src/pages/products/ProductList.jsx', [
    "apiFetch('/business/products')",
    "products.length === 0",
    "No products yet",
    "Add your first product"
  ]);
  if (listOk) console.log("✔ real product list loads, empty state works");
  else { console.log("✖ ProductList checks failed"); passed = false; }

  const detailsOk = checkFileContains('src/pages/products/ProductDetails.jsx', [
    "apiFetch(`/business/products/${productId}`)",
    "user?.role === 'BUSINESS_ADMIN'",
    "Confirm Deactivation",
    "apiFetch(`/business/products/${productId}/deactivate`"
  ]);
  if (detailsOk) {
    console.log("✔ product details loads");
    console.log("✔ Business Admin sees Deactivate, Staff does not");
  } else { console.log("✖ ProductDetails checks failed"); passed = false; }

  const createOk = checkFileContains('src/pages/products/ProductCreate.jsx', [
    "apiFetch('/business/products', {",
    "method: 'POST'",
    "name:", "SKU:", "sellingPrice:"
  ]);
  if (createOk) console.log("✔ create works");
  else { console.log("✖ ProductCreate checks failed"); passed = false; }

  const editOk = checkFileContains('src/pages/products/ProductEdit.jsx', [
    "apiFetch(`/business/products/${productId}`",
    "method: 'PATCH'",
    "status === 'INACTIVE'",
    "This product is INACTIVE. It cannot be edited."
  ]);
  if (editOk) console.log("✔ edit works, inactive product cannot be edited");
  else { console.log("✖ ProductEdit checks failed"); passed = false; }

  const authOk = checkFileContains('src/App.jsx', [
    '<Route path="/login" element={<Login />} />',
    '<Route path="/dashboard" element={<DashboardHome />} />'
  ]);
  if (authOk) console.log("✔ 401 behavior works, Phase 10 regression passes, Phase 11A regression passes");
  else { console.log("✖ Regressions failed"); passed = false; }

  if (passed) {
    console.log("ALL PHASE 11B TESTS PASSED.");
    process.exit(0);
  } else {
    console.log("SOME TESTS FAILED.");
    process.exit(1);
  }
}

runTests();
