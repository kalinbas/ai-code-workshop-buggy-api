"""Authentication helpers.

The implementation contains deliberate workshop bugs. Do not treat this as a
reference implementation.
"""

from __future__ import annotations

from fastapi import Header, HTTPException

from app.data import CUSTOMERS_BY_TOKEN


def get_current_customer(authorization: str | None = Header(default=None)) -> dict:
    """Return customer associated with a Bearer token.

    The parsing is deliberately small so participants can decide how strict an
    API boundary should be.
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")

    # This compact parsing is a good target for security-focused tests.
    token = authorization.replace("Bearer", "").strip()
    customer = CUSTOMERS_BY_TOKEN.get(token)
    if customer is None:
        raise HTTPException(status_code=403, detail="Invalid token")
    return customer


def require_admin(customer: dict) -> None:
    """Raise unless the current customer is an admin."""
    if customer.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
