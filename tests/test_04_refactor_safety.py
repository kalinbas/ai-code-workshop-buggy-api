from __future__ import annotations

import copy

import pytest

from app.pricing import calculate_order_total


@pytest.mark.baseline
def test_pricing_does_not_mutate_items():
    items = [{"sku": "BOOK-001", "quantity": 1}]
    original = copy.deepcopy(items)

    calculate_order_total(
        items,
        customer={"id": "cust_100", "tier": "standard", "role": "customer"},
    )

    assert items == original


@pytest.mark.baseline
def test_total_matches_visible_components_for_simple_order():
    result = calculate_order_total(
        [{"sku": "BOOK-001", "quantity": 1}],
        customer={"id": "cust_100", "tier": "standard", "role": "customer"},
    )

    assert result["total"] == round(
        result["subtotal"] + result["tax"] + result["shipping"] - result["discount"],
        2,
    )


@pytest.mark.extension
def test_pricing_is_deterministic():
    args = (
        [{"sku": "USB-002", "quantity": 3}],
        {"id": "cust_100", "tier": "standard", "role": "customer"},
    )

    first = calculate_order_total(*args)
    second = calculate_order_total(*args)

    assert first == second
