import assert from "node:assert/strict";
import test from "node:test";
import { auth, withClient } from "./helpers.js";

test("[baseline] malformed Bearer header is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: { Authorization: "BearerBearer user-token-1" },
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    assert.ok([401, 403].includes(response.status));
  });
});

test("[extension] customer cannot read another customer's order", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const read = await client.get(`/orders/${create.body.id}`, {
      headers: auth("premium-token-1"),
    });

    assert.ok([403, 404].includes(read.status));
  });
});

test("[extension] non-admin cannot access revenue report", async () => {
  await withClient(async (client) => {
    const response = await client.get("/reports/revenue", {
      headers: auth("user-token-1"),
    });

    assert.equal(response.status, 403);
  });
});

test("[expert] non-admin cannot refund order", async () => {
  await withClient(async (client) => {
    const create = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1 }] },
    });

    const refund = await client.post(`/orders/${create.body.id}/refund`, {
      headers: auth("user-token-1"),
      body: { reason: "changed mind" },
    });

    assert.equal(refund.status, 403);
  });
});
