from __future__ import annotations

import pytest

from tests.conftest import auth


@pytest.mark.extension
def test_coupon_discounts_subtotal_only_and_reduces_taxable_amount(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={
            "coupon": "WELCOME10",
            "items": [{"sku": "BOOK-001", "quantity": 2}],
        },
    )

    assert response.status_code == 200
    pricing = response.json()["pricing"]
    assert pricing["subtotal"] == 84.00
    assert pricing["discount"] == 8.40
    assert pricing["tax"] == 12.10
    assert pricing["shipping"] == 5.00
    assert pricing["total"] == 92.70


@pytest.mark.extension
def test_expired_coupon_is_rejected(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={
            "coupon": "EXPIRED20",
            "items": [{"sku": "BOOK-001", "quantity": 1}],
        },
    )

    assert response.status_code in (400, 422)


@pytest.mark.extension
def test_coupon_minimum_subtotal_is_enforced(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={
            "coupon": "BIGORDER15",
            "items": [{"sku": "BOOK-001", "quantity": 1}],
        },
    )

    assert response.status_code in (400, 422)


@pytest.mark.expert
def test_premium_free_shipping_at_exact_threshold_before_discount(client):
    response = client.post(
        "/orders",
        headers=auth("premium-token-1"),
        json={"items": [{"sku": "KB-003", "quantity": 1}]},
    )

    assert response.status_code == 200
    pricing = response.json()["pricing"]
    assert pricing["subtotal"] == 100.00
    assert pricing["shipping"] == 0.00
    assert pricing["total"] == 116.00
