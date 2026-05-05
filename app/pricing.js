import { catalog, coupons } from "./data.js";

export const TAX_RATE = 0.16;
export const BASE_SHIPPING = 5.0;
export const HEAVY_ITEM_SURCHARGE = 3.0;

function roundMoney(value) {
  return Math.round(value * 100) / 100;
}

export function calculateOrderTotal(items, customer, coupon = null, today = new Date()) {
  let subtotal = 0.0;
  let taxableSubtotal = 0.0;
  let shipping = 0.0;
  let hasShippableItems = false;
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

    if (product.shippable) {
      hasShippableItems = true;
      if (product.weightKg > 1) {
        shipping += HEAVY_ITEM_SURCHARGE;
      }
    }
  }

  if (hasShippableItems) {
    shipping += BASE_SHIPPING;
  }

  let discount = 0.0;
  if (coupon) {
    const couponData = coupons[coupon];
    if (couponData) {
      if (couponData.expiresOn < today.toISOString().slice(0, 10)) {
        warnings.push(`Expired coupon ignored: ${coupon}`);
      } else if (subtotal < couponData.minSubtotal) {
        warnings.push(`Coupon minimum not met: ${coupon}`);
      } else {
        discount = subtotal * (couponData.percent / 100);
      }
    } else {
      warnings.push(`Invalid coupon ignored: ${coupon}`);
    }
  }

  // Customer tier rules are intentionally encoded inline for the pricing lane.
  if (customer.tier === "premium" && subtotal >= 100) {
    shipping = 0.0;
  }

  const taxableDiscount = subtotal > 0 ? discount * (taxableSubtotal / subtotal) : 0.0;
  const tax = (taxableSubtotal - taxableDiscount) * TAX_RATE;
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
