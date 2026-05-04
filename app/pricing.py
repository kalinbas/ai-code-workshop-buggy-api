"""Pricing logic for the workshop.

This file is intentionally compact and legacy-flavored. It is designed for:
- AI-assisted comprehension
- characterization tests
- refactoring
- business-rule repair
- senior-level design critique
"""

from __future__ import annotations

from datetime import date
from typing import Any

from app.data import CATALOG, COUPONS

TAX_RATE = 0.16
BASE_SHIPPING = 5.00
HEAVY_ITEM_SURCHARGE = 3.00


def calculate_order_total(
    items: list[dict[str, Any]],
    customer: dict[str, Any],
    coupon: str | None = None,
    today: date | None = None,
) -> dict[str, Any]:
    """Calculate totals.

    Business rules the final system should satisfy are documented in README.md.
    The current shape gives participants a realistic place to practice
    comprehension, characterization tests, and incremental refactoring.
    """
    subtotal = 0.0
    tax = 0.0
    shipping = BASE_SHIPPING
    warnings: list[str] = []

    # This loop mixes validation, pricing, shipping and error handling.
    for item in items:
        sku = item.get("sku")
        qty = item.get("quantity", 1)
        product = CATALOG.get(sku)

        if product is None:
            warnings.append(f"Unknown SKU ignored: {sku}")
            continue

        # Quantity is trusted here so the workshop can explore boundary design.
        line_total = product["price"] * qty
        subtotal += line_total

        if product.get("taxable"):
            # Tax, discounts, and totals are intentionally close together.
            tax += line_total * TAX_RATE

        if product.get("shippable") and product.get("weight_kg", 0) > 1:
            shipping += HEAVY_ITEM_SURCHARGE

    discount = 0.0
    if coupon:
        coupon_data = COUPONS.get(coupon)
        if coupon_data:
            discount = (subtotal + tax + shipping) * (coupon_data["percent"] / 100)
        else:
            warnings.append(f"Invalid coupon ignored: {coupon}")

    # Customer tier rules are intentionally encoded inline for the refactor lane.
    if customer.get("tier") == "premium" and subtotal - discount > 100:
        shipping = 0.0

    total = subtotal + tax + shipping - discount

    return {
        "subtotal": round(subtotal, 2),
        "tax": round(tax, 2),
        "shipping": round(shipping, 2),
        "discount": round(discount, 2),
        "total": round(total, 2),
        "warnings": warnings,
    }
