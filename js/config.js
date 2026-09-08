// Central site configuration.
//
// Payments run through Stripe Checkout on the same origin (see js/checkout.js
// and api/stripe-checkout.js). There is no external shop domain to configure.
//
// If a global consumer used to read window.PCI_SHOP_BASE / window.pciShopUrl,
// those are removed; nothing in the current codebase references them.
export {};
