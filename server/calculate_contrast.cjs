function hexToRgb(hex) {
  let c = hex.replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  const num = parseInt(c, 16);
  return [num >> 16, (num >> 8) & 255, num & 255];
}

function srgbLuminance(r, g, b) {
  const [rs, gs, bs] = [r, g, b].map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function blend(fgHex, bgHex, alpha) {
  const [r1, g1, b1] = hexToRgb(fgHex);
  const [r2, g2, b2] = hexToRgb(bgHex);
  const r = Math.round(r2 * (1 - alpha) + r1 * alpha);
  const g = Math.round(g2 * (1 - alpha) + g1 * alpha);
  const b = Math.round(b2 * (1 - alpha) + b1 * alpha);
  return '#' + [r, g, b].map(x => x.toString(16).padStart(2, '0')).join('');
}

function contrastRatio(hex1, hex2) {
  const [r1, g1, b1] = hexToRgb(hex1);
  const [r2, g2, b2] = hexToRgb(hex2);
  const l1 = srgbLuminance(r1, g1, b1);
  const l2 = srgbLuminance(r2, g2, b2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return ((lighter + 0.05) / (darker + 0.05)).toFixed(2);
}

// Background anchors
const darkCanvas = '#0B171D';
const darkCard = '#16313A';
const darkTableBg = '#102A33';
const lightCanvas = '#F7F5F0';
const lightCard = '#FDFCF9';
const lightTableBg = '#FFFFFF';

// Badge tinted fills (12% in dark, 10% in light)
const darkSuccessBg = blend('#38C187', darkCard, 0.12);
const darkWarningBg = blend('#E3B341', darkCard, 0.12);
const darkDangerBg = blend('#F58888', darkCard, 0.12);
const darkInfoBg = blend('#72B7E8', darkCard, 0.12);

const lightSuccessBg = blend('#10724C', lightCard, 0.10);
const lightWarningBg = blend('#945700', lightCard, 0.10);
const lightDangerBg = blend('#BA2828', lightCard, 0.10);
const lightInfoBg = blend('#1B6E8A', lightCard, 0.10);

// KPI Card tinted background for Reorder Alert
const darkReorderAlertBg = blend('#E3B341', darkCard, 0.04);
const lightReorderAlertBg = blend('#945700', lightCard, 0.04);

const pairs = [
  // --- A. KPI TINTS & CARDS (Dark Theme) ---
  { theme: 'Dark', category: 'KPI Cards', element: 'KPI Title Text', fg: '#91A5AD', bg: darkCard, min: 4.5 },
  { theme: 'Dark', category: 'KPI Cards', element: 'KPI Value (Primary)', fg: '#F4F7F8', bg: darkCard, min: 7.0 },
  { theme: 'Dark', category: 'KPI Cards', element: 'KPI Subtitle / Metadata', fg: '#829AA4', bg: darkCard, min: 4.5 },
  { theme: 'Dark', category: 'KPI Cards', element: 'Available Stock KPI Green', fg: '#38C187', bg: darkCard, min: 4.5 },
  { theme: 'Dark', category: 'KPI Cards', element: 'Reserved / Low Stock KPI Amber', fg: '#E3B341', bg: darkCard, min: 4.5 },
  { theme: 'Dark', category: 'KPI Cards', element: 'Reorder Alert Amber on Alert Card BG', fg: '#E3B341', bg: darkReorderAlertBg, min: 4.5 },

  // --- B. SUPPLIER & PO STATUS BADGES (Dark Theme) ---
  { theme: 'Dark', category: 'Badges', element: 'Supplier Active / PO Received', fg: '#38C187', bg: darkSuccessBg, min: 4.5 },
  { theme: 'Dark', category: 'Badges', element: 'PO Pending / Low Stock Amber', fg: '#E3B341', bg: darkWarningBg, min: 4.5 },
  { theme: 'Dark', category: 'Badges', element: 'Supplier Inactive / Out of Stock', fg: '#F58888', bg: darkDangerBg, min: 4.5 },
  { theme: 'Dark', category: 'Badges', element: 'Procurement Info Badge', fg: '#72B7E8', bg: darkInfoBg, min: 4.5 },

  // --- C. TABLE TOTALS & DATA CELLS (Dark Theme) ---
  { theme: 'Dark', category: 'Tables & Totals', element: 'Table Header Column Label', fg: '#91A5AD', bg: darkTableBg, min: 4.5 },
  { theme: 'Dark', category: 'Tables & Totals', element: 'Table Row Primary Text / PO Link', fg: '#F4F7F8', bg: darkTableBg, min: 7.0 },
  { theme: 'Dark', category: 'Tables & Totals', element: 'Table SKU & Vendor ID Mono', fg: '#91A5AD', bg: darkTableBg, min: 4.5 },
  { theme: 'Dark', category: 'Tables & Totals', element: 'PO Total Cost Value (Table Cell)', fg: '#F4F7F8', bg: darkTableBg, min: 7.0 },
  { theme: 'Dark', category: 'Tables & Totals', element: 'Order Total Banner Value', fg: '#F4F7F8', bg: darkCard, min: 7.0 },
  { theme: 'Dark', category: 'Tables & Totals', element: 'Row Action Quiet "View" Link', fg: '#91A5AD', bg: darkTableBg, min: 4.5 },

  // --- A. KPI TINTS & CARDS (Light Theme) ---
  { theme: 'Light', category: 'KPI Cards', element: 'KPI Title Text', fg: '#576875', bg: lightCard, min: 4.5 },
  { theme: 'Light', category: 'KPI Cards', element: 'KPI Value (Primary)', fg: '#172027', bg: lightCard, min: 7.0 },
  { theme: 'Light', category: 'KPI Cards', element: 'KPI Subtitle / Metadata', fg: '#607382', bg: lightCard, min: 4.5 },
  { theme: 'Light', category: 'KPI Cards', element: 'Available Stock KPI Green', fg: '#10724C', bg: lightCard, min: 4.5 },
  { theme: 'Light', category: 'KPI Cards', element: 'Reserved / Low Stock KPI Amber', fg: '#945700', bg: lightCard, min: 4.5 },
  { theme: 'Light', category: 'KPI Cards', element: 'Reorder Alert Amber on Alert Card BG', fg: '#945700', bg: lightReorderAlertBg, min: 4.5 },

  // --- B. SUPPLIER & PO STATUS BADGES (Light Theme) ---
  { theme: 'Light', category: 'Badges', element: 'Supplier Active / PO Received', fg: '#10724C', bg: lightSuccessBg, min: 4.5 },
  { theme: 'Light', category: 'Badges', element: 'PO Pending / Low Stock Amber', fg: '#945700', bg: lightWarningBg, min: 4.5 },
  { theme: 'Light', category: 'Badges', element: 'Supplier Inactive / Out of Stock', fg: '#BA2828', bg: lightDangerBg, min: 4.5 },
  { theme: 'Light', category: 'Badges', element: 'Procurement Info Badge', fg: '#1B6E8A', bg: lightInfoBg, min: 4.5 },

  // --- C. TABLE TOTALS & DATA CELLS (Light Theme) ---
  { theme: 'Light', category: 'Tables & Totals', element: 'Table Header Column Label', fg: '#576875', bg: lightTableBg, min: 4.5 },
  { theme: 'Light', category: 'Tables & Totals', element: 'Table Row Primary Text / PO Link', fg: '#172027', bg: lightTableBg, min: 7.0 },
  { theme: 'Light', category: 'Tables & Totals', element: 'Table SKU & Vendor ID Mono', fg: '#576875', bg: lightTableBg, min: 4.5 },
  { theme: 'Light', category: 'Tables & Totals', element: 'PO Total Cost Value (Table Cell)', fg: '#172027', bg: lightTableBg, min: 7.0 },
  { theme: 'Light', category: 'Tables & Totals', element: 'Order Total Banner Value', fg: '#172027', bg: lightCard, min: 7.0 },
  { theme: 'Light', category: 'Tables & Totals', element: 'Row Action Quiet "View" Link', fg: '#576875', bg: lightTableBg, min: 4.5 },
];

console.log('| Theme | Category | Element | Foreground | Actual Background | Ratio | Target | Compliance |');
console.log('| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |');
for (const p of pairs) {
  const ratio = parseFloat(contrastRatio(p.fg, p.bg));
  const pass = ratio >= p.min;
  console.log(`| ${p.theme} | ${p.category} | ${p.element} | \`${p.fg}\` | \`${p.bg}\` | **${ratio.toFixed(2)}:1** | >= ${p.min}:1 | ${pass ? 'PASS' : 'FAIL'} |`);
}
