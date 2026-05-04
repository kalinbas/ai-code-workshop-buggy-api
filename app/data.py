"""Tiny in-memory data store for the workshop.

This is intentionally not production-grade. Participants should decide which
problems are worth fixing for the exercise and which are acceptable constraints
for a small kata.
"""

from __future__ import annotations

CATALOG = {
    "BOOK-001": {
        "name": "Clean Code-ish Book",
        "price": 42.00,
        "taxable": True,
        "weight_kg": 0.7,
        "shippable": True,
    },
    "USB-002": {
        "name": "USB-C Hub",
        "price": 25.00,
        "taxable": True,
        "weight_kg": 0.2,
        "shippable": True,
    },
    "KB-003": {
        "name": "Mechanical Keyboard",
        "price": 100.00,
        "taxable": True,
        "weight_kg": 1.4,
        "shippable": True,
    },
    "GIFT-CARD": {
        "name": "Gift Card",
        "price": 50.00,
        "taxable": False,
        "weight_kg": 0.0,
        "shippable": False,
    },
}

CUSTOMERS_BY_TOKEN = {
    "user-token-1": {
        "id": "cust_100",
        "name": "Ada",
        "tier": "standard",
        "role": "customer",
        "country": "MX",
    },
    "premium-token-1": {
        "id": "cust_200",
        "name": "Grace",
        "tier": "premium",
        "role": "customer",
        "country": "US",
    },
    "admin-token": {
        "id": "admin_001",
        "name": "Linus",
        "tier": "internal",
        "role": "admin",
        "country": "US",
    },
}

COUPONS = {
    "WELCOME10": {
        "percent": 10,
        "expires_on": "2099-01-01",
        "min_subtotal": 0,
    },
    "BIGORDER15": {
        "percent": 15,
        "expires_on": "2099-01-01",
        "min_subtotal": 150,
    },
    "EXPIRED20": {
        "percent": 20,
        "expires_on": "2024-01-01",
        "min_subtotal": 0,
    },
}

ORDERS: dict[str, dict] = {}
AUDIT_LOG: list[dict] = []
