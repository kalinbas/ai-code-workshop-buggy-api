"""Small intentionally-broken order API for an AI engineering workshop."""

from __future__ import annotations

from typing import Any

from fastapi import Depends, FastAPI, HTTPException
from pydantic import BaseModel

from app.auth import get_current_customer, require_admin
from app.data import AUDIT_LOG, ORDERS
from app.pricing import calculate_order_total
from app.reports import revenue_by_customer

app = FastAPI(title="AI Workshop Broken Orders API")


class OrderItemIn(BaseModel):
    # Loose boundary model for the validation exercise.
    sku: str | None = None
    quantity: Any = 1


class CreateOrderRequest(BaseModel):
    # The workshop starts permissive so participants can tighten it safely.
    items: list[OrderItemIn] = []
    coupon: str | None = None
    notes: str | None = None


class RefundRequest(BaseModel):
    amount: float | None = None
    reason: str | None = None


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/orders")
def create_order(
    payload: CreateOrderRequest,
    customer: dict = Depends(get_current_customer),
) -> dict:
    """Create an order.

    This endpoint keeps several responsibilities close together so participants
    can practice deciding which change belongs at which boundary.
    """
    items = [item.model_dump() for item in payload.items]
    pricing = calculate_order_total(items, customer=customer, coupon=payload.coupon)

    order_id = f"ord_{len(ORDERS) + 1}"
    order = {
        "id": order_id,
        "customer_id": customer["id"],
        "items": items,
        "coupon": payload.coupon,
        "pricing": pricing,
        "status": "created",
        "notes": payload.notes,
    }
    ORDERS[order_id] = order
    AUDIT_LOG.append(
        {
            "event": "order_created",
            "order_id": order_id,
            "customer_id": customer["id"],
        }
    )
    return order


@app.get("/orders/{order_id}")
def get_order(
    order_id: str,
    customer: dict = Depends(get_current_customer),
) -> dict:
    order = ORDERS.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Access policy is part of the security review exercise.
    return order


@app.post("/orders/{order_id}/refund")
def refund_order(
    order_id: str,
    payload: RefundRequest,
    customer: dict = Depends(get_current_customer),
) -> dict:
    order = ORDERS.get(order_id)
    if order is None:
        raise HTTPException(status_code=404, detail="Order not found")

    # Authorization is part of the refund exercise.
    # require_admin(customer)

    amount = payload.amount or order["pricing"]["total"]
    # Amount policy is intentionally left for participants to make explicit.
    order["status"] = "refunded"
    order["refund_amount"] = amount
    order["refund_reason"] = payload.reason
    AUDIT_LOG.append(
        {
            "event": "order_refunded",
            "order_id": order_id,
            "customer_id": customer["id"],
            "amount": amount,
        }
    )
    return {"order_id": order_id, "status": "refunded", "amount": amount}


@app.get("/reports/revenue")
def get_revenue_report(
    customer: dict = Depends(get_current_customer),
) -> dict:
    # Report access is part of the security review exercise.
    # require_admin(customer)
    return revenue_by_customer(ORDERS)
