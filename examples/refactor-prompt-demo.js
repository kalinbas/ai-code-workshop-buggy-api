// Presentation demo: vague refactor prompt vs. better prompt.
//
// Run:
//   node examples/refactor-prompt-demo.js

const VAGUE_PROMPT = "Refactor this function.";

const BETTER_PROMPT = `
Refactor this function, but first identify likely business-rule bugs.
Keep the same public signature and return shape.
Fix only these rules:
- SAVE10 discounts the subtotal only, not tax or shipping
- premium free shipping uses subtotal before discount and starts at >= 100
`;

const PRODUCTS = {
  book: [42, true, true, false],
  usb: [25, true, true, false],
  keyboard: [100, true, true, true],
  "gift-card": [50, false, false, false],
};

function summarizeCart(cart, user, coupon = null) {
  let total = 0;
  let tax = 0;
  let shipping = 5;
  const warnings = [];

  for (const item of cart) {
    const sku = item.sku;
    const qty = item.qty ?? 1;
    let price, taxable, shippable, heavy;

    if (sku === "book") {
      price = 42; taxable = true; shippable = true; heavy = false;
    } else if (sku === "usb") {
      price = 25; taxable = true; shippable = true; heavy = false;
    } else if (sku === "keyboard") {
      price = 100; taxable = true; shippable = true; heavy = true;
    } else if (sku === "gift-card") {
      price = 50; taxable = false; shippable = false; heavy = false;
    } else {
      warnings.push("unknown sku ignored");
      continue;
    }

    const line = price * qty;
    total += line;
    if (taxable) tax += line * 0.16;
    if (shippable && heavy) shipping += 3;
  }

  const discount = coupon === "SAVE10" ? (total + tax + shipping) * 0.10 : 0;
  if (user.premium && total - discount > 100) shipping = 0;

  return moneyResult(total, tax, shipping, discount, warnings);
}

function summarizeCartMehResult(cart, user, coupon = null) {
  let subtotal = 0;
  let tax = 0;
  let shipping = 5;
  const warnings = [];

  for (const item of cart) {
    const product = PRODUCTS[item.sku];
    if (!product) {
      warnings.push("unknown sku ignored");
      continue;
    }
    const [price, taxable, shippable, heavy] = product;
    const line = price * (item.qty ?? 1);
    subtotal += line;
    if (taxable) tax += line * 0.16;
    if (shippable && heavy) shipping += 3;
  }

  const discount = coupon === "SAVE10" ? (subtotal + tax + shipping) * 0.10 : 0;
  if (user.premium && subtotal - discount > 100) shipping = 0;

  return moneyResult(subtotal, tax, shipping, discount, warnings);
}

function summarizeCartGoodResult(cart, user, coupon = null) {
  let subtotal = 0;
  let tax = 0;
  let hasHeavyItem = false;
  const warnings = [];

  for (const item of cart) {
    const product = PRODUCTS[item.sku];
    if (!product) {
      warnings.push("unknown sku ignored");
      continue;
    }
    const [price, taxable, shippable, heavy] = product;
    const line = price * (item.qty ?? 1);
    subtotal += line;
    if (taxable) tax += line * 0.16;
    if (shippable && heavy) hasHeavyItem = true;
  }

  const discount = coupon === "SAVE10" ? subtotal * 0.10 : 0;
  let shipping = user.premium && subtotal >= 100 ? 0 : 5;
  if (shipping && hasHeavyItem) shipping += 3;

  return moneyResult(subtotal, tax, shipping, discount, warnings);
}

function moneyResult(subtotal, tax, shipping, discount, warnings) {
  return {
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
    shipping: roundMoney(shipping),
    discount: roundMoney(discount),
    total: roundMoney(subtotal + tax + shipping - discount),
    warnings,
  };
}

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

const normalCart = [{ sku: "book" }, { sku: "usb", qty: 2 }, { sku: "missing" }];
const bugRevealingCart = [{ sku: "keyboard" }];

const normalUser = { premium: false };
const premiumUser = { premium: true };

console.assert(
  JSON.stringify(summarizeCart(normalCart, normalUser)) ===
    JSON.stringify(summarizeCartMehResult(normalCart, normalUser)),
);
console.assert(
  JSON.stringify(summarizeCart(normalCart, normalUser)) ===
    JSON.stringify(summarizeCartGoodResult(normalCart, normalUser)),
);

const messyEdge = summarizeCart(bugRevealingCart, premiumUser, "SAVE10");
const mehEdge = summarizeCartMehResult(bugRevealingCart, premiumUser, "SAVE10");
const goodEdge = summarizeCartGoodResult(bugRevealingCart, premiumUser, "SAVE10");

console.assert(JSON.stringify(messyEdge) === JSON.stringify(mehEdge));
console.assert(JSON.stringify(goodEdge) !== JSON.stringify(messyEdge));

console.log("Vague prompt:");
console.log(VAGUE_PROMPT);
console.log("\nBetter prompt:");
console.log(BETTER_PROMPT.trim());
console.log("\nBug-revealing input:");
console.log(bugRevealingCart, premiumUser, "coupon=SAVE10");
console.log("\nMessy / meh result:");
console.log(messyEdge);
console.log("\nBetter-prompt result:");
console.log(goodEdge);
