"""Reporting code with intentional legacy smells."""

from __future__ import annotations

from typing import Any


def revenue_by_customer(orders: dict[str, dict[str, Any]]) -> dict[str, Any]:
    """Return revenue grouped by customer.

    The report works directly with order dictionaries so participants can
    practice characterization tests before improving the shape.
    """
    totals: dict[str, float] = {}

    for order in orders.values():
        customer_id = order["customer_id"]
        total = order["pricing"]["total"]
        totals[customer_id] = totals.get(customer_id, 0.0) + total

    rows = []
    for customer_id, total in totals.items():
        rows.append({"customer_id": customer_id, "revenue": round(total, 2)})

    return {
        "rows": rows,
        "grand_total": round(sum(row["revenue"] for row in rows), 2),
    }
