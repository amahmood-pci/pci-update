// Central site configuration.
//
// SHOP_BASE is where the Squarespace store lives. Product "Buy" links and the
// cart checkout hand off here. Switch this ONE line when DNS for the custom
// subdomain is connected:
//   • While Squarespace is on its default domain:  https://shop-pcibio.squarespace.com
//   • Once shop.pcibio.com is connected in Squarespace: https://shop.pcibio.com
export const SHOP_BASE = 'https://shop.pcibio.com';

// Also expose globally for any non-module usage.
window.PCI_SHOP_BASE = SHOP_BASE;

// Build a Squarespace product URL from a product record. Products carry a full
// `url` (…/shop/p/<slug>); we swap in the current SHOP_BASE so the domain is
// controlled from this single file.
export function shopUrl(product) {
  if (!product || !product.url) return SHOP_BASE;
  const slug = product.url.split('/shop/p/')[1];
  return slug ? `${SHOP_BASE}/shop/p/${slug}` : SHOP_BASE;
}

window.pciShopUrl = shopUrl;
