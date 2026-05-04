from __future__ import annotations

import pytest

from app.data import ORDERS
from tests.conftest import auth


@pytest.mark.baseline
def test_valid_order_can_be_created(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": 2}]},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "ord_1"
    assert body["pricing"]["subtotal"] == 84.00
    assert body["pricing"]["tax"] == 13.44
    assert body["pricing"]["shipping"] == 5.00
    assert body["pricing"]["total"] == 102.44


@pytest.mark.baseline
def test_empty_order_is_rejected(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": []},
    )

    assert response.status_code in (400, 422)


@pytest.mark.baseline
def test_unknown_sku_is_rejected_instead_of_silently_ignored(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "NOPE-999", "quantity": 1}]},
    )

    assert response.status_code in (400, 422)


@pytest.mark.baseline
def test_negative_quantity_is_rejected(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": -3}]},
    )

    assert response.status_code in (400, 422)


@pytest.mark.extension
def test_quantity_must_be_an_integer_not_a_string(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": "2"}]},
    )

    assert response.status_code in (400, 422)


@pytest.mark.extension
def test_quantity_must_not_be_bool(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={"items": [{"sku": "BOOK-001", "quantity": True}]},
    )

    assert response.status_code in (400, 422)


@pytest.mark.expert
def test_mixed_valid_and_invalid_items_do_not_create_partial_order(client):
    response = client.post(
        "/orders",
        headers=auth("user-token-1"),
        json={
            "items": [
                {"sku": "BOOK-001", "quantity": 1},
                {"sku": "NOPE-999", "quantity": 1},
            ]
        },
    )

    assert response.status_code in (400, 422)
    assert ORDERS == {}
