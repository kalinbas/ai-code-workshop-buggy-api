import assert from "node:assert/strict";
import test from "node:test";
import { resetState } from "../app/data.js";
import { createApp } from "../app/server.js";
import { auth, withClient } from "./helpers.js";

async function withRawClient(fn) {
  resetState();
  const server = createApp();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    return await fn({ baseUrl });
  } finally {
    await new Promise((resolve) => server.close(resolve));
    resetState();
  }
}

test("[regression:aggressive] invalid JSON returns a client error", async () => {
  await withRawClient(async ({ baseUrl }) => {
    const response = await fetch(`${baseUrl}/orders`, {
      method: "POST",
      headers: {
        Authorization: "Bearer user-token-1",
        "content-type": "application/json",
      },
      body: "{ not valid json",
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[regression:aggressive] explicit null quantity is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: null }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[regression:aggressive] double refund is rejected", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const firstRefund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { reason: "first refund" },
    });
    const secondRefund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { reason: "second refund" },
    });

    assert.equal(firstRefund.status, 200);
    assert.ok([400, 409, 422].includes(secondRefund.status));
  });
});

test("[regression:aggressive] cumulative partial refunds cannot exceed order total", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const firstRefund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { amount: 30, reason: "partial refund" },
    });
    const secondRefund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("admin-token"),
      body: { amount: 30, reason: "exceeds remaining total" },
    });

    assert.equal(firstRefund.status, 200);
    assert.ok([400, 409, 422].includes(secondRefund.status));
  });
});

test("[regression:aggressive] bearer token with tab separator is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: { Authorization: "Bearer\tuser-token-1" },
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    assert.equal(response.status, 401);
  });
});
