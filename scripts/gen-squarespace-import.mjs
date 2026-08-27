// Generates a Squarespace-compatible product import CSV from js/products.js,
// and rewrites each product's `url` in js/products.js to the new
// shop.pcibio.com slug so the Vercel "Buy" links match the Squarespace pages.
//
// Run:  node scripts/gen-squarespace-import.mjs
//
// Output:
//   squarespace-products-import.csv   (upload in Squarespace → Products → Import)
//   js/products.js                    (url fields rewritten in place)

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

// --- config ---------------------------------------------------------------
const SHOP_BASE = 'https://shop.pcibio.com';        // where Squarespace shop lives
const IMAGE_BASE = 'https://pci-update.vercel.app';  // where product photos are hosted
const PRODUCT_PAGE = 'Shop';                          // Squarespace store page name
// --------------------------------------------------------------------------

// Load the product array by shimming `window`.
const productsSrc = readFileSync(resolve(root, 'js/products.js'), 'utf8');
const win = {};
new Function('window', productsSrc)(win);
const products = win.pciProducts;
if (!Array.isArray(products)) throw new Error('Could not read window.pciProducts');

// Deterministic slug from the product name; de-duplicated.
const seen = new Set();
const slugify = (name, code) => {
  let s = name
    .toLowerCase()
    .replace(/[™®]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (seen.has(s)) s = `${s}-${code.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  seen.add(s);
  return s;
};

const csvCell = (v) => {
  const s = v == null ? '' : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

const headers = [
  'Product ID', 'Variant ID', 'Product Type', 'Product Page', 'Product URL',
  'Title', 'Description', 'SKU', 'Price', 'Sale Price', 'On Sale', 'Stock',
  'Categories', 'Tags', 'Weight', 'Length', 'Width', 'Height', 'Visible',
  'Hosted Image URLs',
];

const rows = [headers.join(',')];
let patched = productsSrc;

for (const p of products) {
  const slug = slugify(p.name, p.code);

  // Rewrite the url in products.js (old value is unique per product).
  const newUrl = `${SHOP_BASE}/shop/p/${slug}`;
  patched = patched.replace(`url: "${p.url}"`, `url: "${newUrl}"`);

  const description = [
    `<p>${p.longDesc}</p>`,
    p.composition ? `<p><strong>Composition:</strong> ${p.composition}</p>` : '',
  ]
    .filter(Boolean)
    .join(' ');

  const category = p.media || (p.imageType === 'block' ? 'FFPE Block' : 'Slide');
  const tags = [p.biomarker, p.type].filter(Boolean).join(', ');
  const imageUrl = p.image ? `${IMAGE_BASE}/${p.image}` : '';

  rows.push([
    '',                 // Product ID (Squarespace assigns)
    '',                 // Variant ID
    'PHYSICAL',
    PRODUCT_PAGE,
    slug,               // Product URL
    p.name,
    description,
    p.code,             // SKU
    p.price.toFixed(2),
    '',                 // Sale Price
    'No',
    'unlimited',        // Stock
    category,
    tags,
    '', '', '', '',     // Weight / Length / Width / Height
    'Yes',
    imageUrl,
  ].map(csvCell).join(','));
}

writeFileSync(resolve(root, 'squarespace-products-import.csv'), rows.join('\n') + '\n', 'utf8');
writeFileSync(resolve(root, 'js/products.js'), patched, 'utf8');

console.log(`Wrote squarespace-products-import.csv (${products.length} products)`);
console.log(`Rewrote js/products.js url fields → ${SHOP_BASE}/shop/p/<slug>`);
