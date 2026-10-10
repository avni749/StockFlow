const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = 'C:\\Users\\avniv\\.gemini\\antigravity\\brain\\57c15555-8bc1-4959-bf64-56ef3eba9d2c';

function toBase64(filename) {
  const filePath = path.join(ARTIFACT_DIR, filename);
  if (!fs.existsSync(filePath)) return '';
  const buffer = fs.readFileSync(filePath);
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

const images = {
  // Checkpoint 3
  desktop_dashboard_dark: toBase64('desktop_dashboard_dark.png'),
  desktop_dashboard_light: toBase64('desktop_dashboard_light.png'),
  mobile_dashboard_dark: toBase64('mobile_dashboard_dark.png'),
  mobile_dashboard_light: toBase64('mobile_dashboard_light.png'),

  desktop_login_dark: toBase64('desktop_login_dark.png'),
  desktop_login_light: toBase64('desktop_login_light.png'),
  mobile_login_dark: toBase64('mobile_login_dark.png'),
  mobile_login_light: toBase64('mobile_login_light.png'),

  desktop_register_dark: toBase64('desktop_register_dark.png'),
  desktop_register_light: toBase64('desktop_register_light.png'),
  mobile_register_dark: toBase64('mobile_register_dark.png'),
  mobile_register_light: toBase64('mobile_register_light.png'),

  desktop_landing_dark: toBase64('desktop_landing_dark.png'),
  desktop_landing_light: toBase64('desktop_landing_light.png'),
  mobile_landing_dark: toBase64('mobile_landing_dark.png'),
  mobile_landing_light: toBase64('mobile_landing_light.png'),

  // Checkpoint 4
  desktop_product_list_dark: toBase64('desktop_product_list_dark.png'),
  desktop_product_list_light: toBase64('desktop_product_list_light.png'),
  mobile_product_list_dark: toBase64('mobile_product_list_dark.png'),
  mobile_product_list_light: toBase64('mobile_product_list_light.png'),

  desktop_product_create_dark: toBase64('desktop_product_create_dark.png'),
  desktop_product_create_light: toBase64('desktop_product_create_light.png'),
  mobile_product_create_dark: toBase64('mobile_product_create_dark.png'),
  mobile_product_create_light: toBase64('mobile_product_create_light.png'),

  desktop_product_details_dark: toBase64('desktop_product_details_dark.png'),
  desktop_product_details_light: toBase64('desktop_product_details_light.png'),
  mobile_product_details_dark: toBase64('mobile_product_details_dark.png'),
  mobile_product_details_light: toBase64('mobile_product_details_light.png'),

  desktop_product_edit_dark: toBase64('desktop_product_edit_dark.png'),
  desktop_product_edit_light: toBase64('desktop_product_edit_light.png'),
  mobile_product_edit_dark: toBase64('mobile_product_edit_dark.png'),
  mobile_product_edit_light: toBase64('mobile_product_edit_light.png'),

  // Image Test
  image_test_products_dark: toBase64('image_test_products_dark.png'),
  image_test_products_light: toBase64('image_test_products_light.png'),
};

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>StockFlow Visual QA Gallery</title>
  <style>
    :root {
      --bg: #0B171D;
      --surface: #102A33;
      --card: #16313A;
      --border: #294650;
      --text: #F4F7F8;
      --text-muted: #91A5AD;
      --copper: #C98A4A;
    }
    body {
      margin: 0;
      padding: 24px;
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }
    h1 {
      margin: 0 0 8px 0;
      font-size: 22px;
      color: var(--copper);
      font-weight: 700;
    }
    p.subtitle {
      margin: 0 0 24px 0;
      color: var(--text-muted);
      font-size: 13px;
    }
    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text);
      margin: 32px 0 16px 0;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(420px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .grid-4 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 24px;
    }
    .card {
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .card-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .badge {
      font-size: 10px;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(201, 138, 74, 0.15);
      color: var(--copper);
      border: 1px solid rgba(201, 138, 74, 0.3);
    }
    .img-wrap {
      border-radius: 6px;
      overflow: hidden;
      border: 1px solid var(--border);
      background: #000;
    }
    .img-wrap img {
      width: 100%;
      height: auto;
      display: block;
    }
  </style>
</head>
<body>
  <h1>StockFlow Senior UI/UX Visual QA Gallery</h1>
  <p class="subtitle">Complete rendered screenshot suite embedded directly as base64 images to bypass local filesystem CSP restrictions.</p>

  <!-- Image Test Section -->
  <div class="section-title">
    <span>Image Pipeline Verification (Valid 200, Missing URL, 404 Fallback, Row Alignment)</span>
    <span class="badge">Verified Pass</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Dark Theme — Products Table Image Suite (Valid 200, Missing, 404 Fallback) <span class="badge">Dark 1440px</span></div>
      <div class="img-wrap"><img src="${images.image_test_products_dark}" alt="Image Test Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Light Theme — Products Table Image Suite (Valid 200, Missing, 404 Fallback) <span class="badge">Light 1440px</span></div>
      <div class="img-wrap"><img src="${images.image_test_products_light}" alt="Image Test Light" /></div>
    </div>
  </div>

  <!-- Checkpoint 4: Products Suite -->
  <div class="section-title">
    <span>Checkpoint 4: Product Catalog & List (/products)</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Desktop Dark (1440px) — Quiet Row Links + Overflow Menu <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_list_dark}" alt="Product List Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Desktop Light (1440px) — Quiet Row Links + Overflow Menu <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_list_light}" alt="Product List Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_list_dark}" alt="Product List Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_list_light}" alt="Product List Mobile Light" /></div>
    </div>
  </div>

  <div class="section-title">
    <span>Checkpoint 4: Product Create (/products/new) with Live Image Preview</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Desktop Dark (1440px) — Live Image Preview Frame <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_create_dark}" alt="Product Create Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Desktop Light (1440px) — Live Image Preview Frame <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_create_light}" alt="Product Create Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_create_dark}" alt="Product Create Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_create_light}" alt="Product Create Mobile Light" /></div>
    </div>
  </div>

  <div class="section-title">
    <span>Checkpoint 4: Product Details (/products/:id)</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Desktop Dark (1440px) — Asset Overview & Metadata <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_details_dark}" alt="Product Details Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Desktop Light (1440px) — Asset Overview & Metadata <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_details_light}" alt="Product Details Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_details_dark}" alt="Product Details Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_details_light}" alt="Product Details Mobile Light" /></div>
    </div>
  </div>

  <div class="section-title">
    <span>Checkpoint 4: Product Edit (/products/:id/edit)</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Desktop Dark (1440px) — Live Image Preview Frame <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_edit_dark}" alt="Product Edit Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Desktop Light (1440px) — Live Image Preview Frame <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_product_edit_light}" alt="Product Edit Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_edit_dark}" alt="Product Edit Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_product_edit_light}" alt="Product Edit Mobile Light" /></div>
    </div>
  </div>

  <!-- Checkpoint 3 Suites -->
  <div class="section-title">
    <span>Checkpoint 3: Dashboard (/dashboard)</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Desktop Dark (1440px) <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_dashboard_dark}" alt="Dashboard Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Desktop Light (1440px) <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_dashboard_light}" alt="Dashboard Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_dashboard_dark}" alt="Dashboard Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_dashboard_light}" alt="Dashboard Mobile Light" /></div>
    </div>
  </div>

  <div class="section-title">
    <span>Checkpoint 3: Landing (/)</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Desktop Dark (1440px) <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_landing_dark}" alt="Landing Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Desktop Light (1440px) <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_landing_light}" alt="Landing Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_landing_dark}" alt="Landing Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_landing_light}" alt="Landing Mobile Light" /></div>
    </div>
  </div>

  <div class="section-title">
    <span>Checkpoint 3: Login (/login) & Register (/register)</span>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Login Desktop Dark <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_login_dark}" alt="Login Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Login Desktop Light <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_login_light}" alt="Login Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Register Desktop Dark <span class="badge">Dark</span></div>
      <div class="img-wrap"><img src="${images.desktop_register_dark}" alt="Register Desktop Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Register Desktop Light <span class="badge">Light</span></div>
      <div class="img-wrap"><img src="${images.desktop_register_light}" alt="Register Desktop Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Login Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_login_dark}" alt="Login Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Login Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_login_light}" alt="Login Mobile Light" /></div>
    </div>
  </div>
  <div class="grid-2">
    <div class="card">
      <div class="card-label">Register Mobile Dark (390px) <span class="badge">Dark Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_register_dark}" alt="Register Mobile Dark" /></div>
    </div>
    <div class="card">
      <div class="card-label">Register Mobile Light (390px) <span class="badge">Light Mobile</span></div>
      <div class="img-wrap"><img src="${images.mobile_register_light}" alt="Register Mobile Light" /></div>
    </div>
  </div>

</body>
</html>
`;

fs.writeFileSync(path.join(ARTIFACT_DIR, 'visual_qa_gallery.html'), html);
console.log('Saved visual_qa_gallery.html successfully!');
