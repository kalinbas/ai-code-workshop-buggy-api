import { catalog, coupons } from "./data.js";
import { HttpError } from "./http-error.js";

export const TAX_RATE = 0.16;
export const BASE_SHIPPING = 5.0;
export const HEAVY_ITEM_SURCHARGE = 3.0;

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

export function calculateOrderTotal(items, customer, coupon = null, today = new Date()) {
  let subtotal = 0.0;
  let taxableSubtotal = 0.0;
  let shipping = BASE_SHIPPING;
  const warnings = [];

  // This loop mixes validation, pricing, shipping, and error handling.
  for (const item of items) {
    const sku = item.sku;
    const qty = item.quantity ?? 1;
    const product = catalog[sku];

    if (!product) {
      warnings.push(`Unknown SKU ignored: ${sku}`);
      continue;
    }

    // Quantity is trusted here so the workshop can explore boundary design.
    const lineTotal = product.price * qty;
    subtotal += lineTotal;

    if (product.taxable) {
      taxableSubtotal += lineTotal;
    }

    if (product.shippable && product.weightKg > 1) {
      shipping += HEAVY_ITEM_SURCHARGE;
    }
  }

  let discount = 0.0;
  let taxableDiscount = 0.0;
  if (coupon) {
    const couponData = coupons[coupon];
    if (!couponData) {
      throw new HttpError(422, `Invalid coupon: ${coupon}`);
    }
    if (couponData.expiresOn < formatDate(today)) {
      throw new HttpError(422, `Expired coupon: ${coupon}`);
    }
    if (subtotal < couponData.minSubtotal) {
      throw new HttpError(422, `Coupon minimum subtotal not met: ${coupon}`);
    }

    discount = subtotal * (couponData.percent / 100);
    taxableDiscount = taxableSubtotal * (couponData.percent / 100);
  }

  // Customer tier rules are intentionally encoded inline for the pricing lane.
  if (customer.tier === "premium" && subtotal >= 100) {
    shipping = 0.0;
  }

  const tax = Math.max(0.0, taxableSubtotal - taxableDiscount) * TAX_RATE;
  const total = subtotal + tax + shipping - discount;

  return {
    subtotal: roundMoney(subtotal),
    tax: roundMoney(tax),
    shipping: roundMoney(shipping),
    discount: roundMoney(discount),
    total: roundMoney(total),
    warnings,
  };
}
