from __future__ import annotations

import pytest

from tests.conftest import auth


@pytest.mark.baseline
def test_malformed_bearer_header_is_rejected(client):
    response = client.get(
        "/health",
        headers={"Authorization": "BearerBearer user-token-1"},
    )
    # /health is public, so malformed auth is not evaluated there.
    # Use a protected endpoint instead.
    response = client.post(
        "/orders",
        headers={"Authorization": "BearerBearer user-token-1"},
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )

    assert response.status_code in (401, 403)


@pytest.mark.extension
def test_customer_cannot_read_another_customers_order(client):
    create = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    assert create.status_code == 200
    order_id = create.json()["id"]

    read = client.get(f"/orders/{order_id}", headers=auth("premium-token-1"))

    assert read.status_code in (403, 404)


@pytest.mark.extension
def test_non_admin_cannot_access_revenue_report(client):
    response = client.get("/reports/revenue", headers=auth("user-token-1"))

    assert response.status_code == 403


@pytest.mark.expert
def test_non_admin_cannot_refund_order(client):
    create = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    order_id = create.json()["id"]

    refund = client.post(
        f"/orders/{order_id}/refund",
        headers=auth("user-token-1"),
        json={"reason": "changed mind"},
    )

    assert refund.status_code == 403


@pytest.mark.expert
def test_refund_amount_cannot_exceed_total(client):
    create = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    order_id = create.json()["id"]

    refund = client.post(
        f"/orders/{order_id}/refund",
        headers=auth("admin-token"),
        json={"amount": 9999, "reason": "test"},
    )

    assert refund.status_code in (400, 422)


@pytest.mark.expert
@pytest.mark.parametrize("amount", [0, -1])
def test_refund_amount_must_be_positive(client, amount):
    create = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    order_id = create.json()["id"]

    refund = client.post(
        f"/orders/{order_id}/refund",
        headers=auth("admin-token"),
        json={"amount": amount, "reason": "test"},
    )

    assert refund.status_code in (400, 422)
