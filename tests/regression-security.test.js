import assert from "node:assert/strict";
import test from "node:test";
import { auth, withClient } from "./helpers.js";

test("[regression:security] wrong auth scheme is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: { Authorization: "Token user-token-1" },
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    assert.ok([401, 403].includes(response.status));
  });
});

test("[regression:security] empty bearer token is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: { Authorization: "Bearer" },
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    assert.ok([401, 403].includes(response.status));
  });
});

test("[regression:security] bearer token with extra parts is rejected as malformed", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: { Authorization: "Bearer user-token-1 extra" },
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    assert.equal(response.status, 401);
  });
});

test("[regression:security] bearer token with leading token whitespace is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: { Authorization: "Bearer  user-token-1" },
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    assert.equal(response.status, 401);
  });
});

test("[regression:security] owner can read own order", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const read = await client.get(`/orders/${create.body.id}`, {
      headers: auth("user-token-1"),
    });

    assert.equal(read.status, 200);
    assert.equal(read.body.id, create.body.id);
    assert.equal(read.body.customerId, "cust_100");
  });
});

test("[regression:security] admin can read any order", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const read = await client.get(`/orders/${create.body.id}`, {
      headers: auth("admin-token"),
    });

    assert.equal(read.status, 200);
    assert.equal(read.body.id, create.body.id);
  });
});

test("[regression:security] admin can refund order", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const refund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { reason: "customer request" },
    });

    assert.equal(refund.status, 200);
    assert.equal(refund.body.status, "refunded");
    assert.equal(refund.body.order_id, create.body.id);
  });
});

test("[regression:security] admin refund rejects zero amount", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const refund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { amount: 0, reason: "invalid amount" },
    });

    assert.ok([400, 422].includes(refund.status));
  });
});

test("[regression:security] admin refund rejects negative amount", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const refund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { amount: -10, reason: "invalid amount" },
    });

    assert.ok([400, 422].includes(refund.status));
  });
});

test("[regression:security] admin refund rejects amount greater than order total", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const refund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { amount: create.body.pricing.total + 1, reason: "too much" },
    });

    assert.ok([400, 422].includes(refund.status));
  });
});

test("[regression:security] admin can access revenue report", async () => {
  await withClient(async (client) => {
    await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const response = await client.get("/reports/revenue", {
      headers: auth("admin-token"),
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.rows.length, 1);
    assert.equal(response.body.grand_total, 53.72);
  });
});
