from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.data import AUDIT_LOG, ORDERS
from app.main import app


def auth(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(autouse=True)
def reset_state():
    ORDERS.clear()
    AUDIT_LOG.clear()
    yield
    ORDERS.clear()
    AUDIT_LOG.clear()


@pytest.fixture
def client():
    return TestClient(app)
