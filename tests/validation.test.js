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

test("[extension] items must be an array", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: "BOOK-001" },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] each item must be an object", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [null] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] SKU is required", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ quantity: 1 }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] quantity must be an integer", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1.5 }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] zero quantity is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 0 }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] very large quantity is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 1001 }] },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] multiple valid items can be ordered", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: {
        items: [
          { sku: "BOOK-001", quantity: 1 },
          { sku: "USB-002", quantity: 2 },
        ],
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.items.length, 2);
    assert.equal(response.body.pricing.subtotal, 92.0);
  });
});
