import assert from "node:assert/strict";
import test from "node:test";
import { auth, withClient } from "./helpers.js";

test("[baseline] valid order can be created", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 2 }] },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.id, "ord_1");
    assert.equal(response.body.pricing.subtotal, 84.0);
    assert.equal(response.body.pricing.tax, 13.44);
    assert.equal(response.body.pricing.shipping, 5.0);
    assert.equal(response.body.pricing.total, 102.44);
  });
});

test("[baseline] empty order is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[baseline] unknown SKU is rejected instead of silently ignored", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "NOPE-999", quantity: 1 }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[baseline] negative quantity is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: -3 }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] quantity must be a number, not a string", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: "2" }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});
