from __future__ import annotations

import pytest

from tests.conftest import auth


@pytest.mark.extension
def test_admin_can_get_revenue_report(client):
    create = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    assert create.status_code == 200

    report = client.get("/reports/revenue", headers=auth("admin-token"))

    assert report.status_code == 200
    body = report.json()
    assert body["rows"] == [{"customer_id": "cust_100", "revenue": 42.0}]
    assert body["grand_total"] == 42.0


@pytest.mark.expert
def test_refunded_orders_do_not_count_as_revenue(client):
    create = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    order_id = create.json()["id"]

    refund = client.post(
        f"/orders/{order_id}/refund",
        headers=auth("admin-token"),
        json={"reason": "customer support"},
    )
    assert refund.status_code == 200

    report = client.get("/reports/revenue", headers=auth("admin-token"))

    assert report.status_code == 200
    body = report.json()
    assert body["rows"] == []
    assert body["grand_total"] == 0


@pytest.mark.expert
def test_revenue_report_is_sorted_and_groups_multiple_customers(client):
    first = client.post(
        "/orders",
        headers=auth("premium-token-1"),
        json={"items": [{"sku": "USB-002", "quantity": 1}]},
    )
    second = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 1}]},
    )
    assert first.status_code == 200
    assert second.status_code == 200

    report = client.get("/reports/revenue", headers=auth("admin-token"))

    assert report.status_code == 200
    body = report.json()
    assert body["rows"] == [
        {"customer_id": "cust_100", "revenue": 42.0},
        {"customer_id": "cust_200", "revenue": 25.0},
    ]
    assert body["grand_total"] == 67.0
