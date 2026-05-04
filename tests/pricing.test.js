import assert from "node:assert/strict";
import test from "node:test";
import { auth, withClient } from "./helpers.js";

test("[extension] coupon discounts subtotal only and reduces taxable amount", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: {
        coupon: "WELCOME10",
        items: [{ sku: "BOOK-001", quantity: 2 }],
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.subtotal, 84.0);
    assert.equal(response.body.pricing.discount, 8.4);
    assert.equal(response.body.pricing.tax, 12.1);
    assert.equal(response.body.pricing.shipping, 5.0);
    assert.equal(response.body.pricing.total, 92.7);
  });
});

test("[extension] expired coupon is rejected", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: {
        coupon: "EXPIRED20",
        items: [{ sku: "BOOK-001", quantity: 1 }],
      },
    });

    assert.ok([400, 422].includes(response.status));
  });
});

test("[extension] premium free shipping at exact threshold before discount", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("premium-token-1"),
      body: { items: [{ sku: "KB-003", quantity: 1 }] },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.subtotal, 100.0);
    assert.equal(response.body.pricing.shipping, 0.0);
    assert.equal(response.body.pricing.total, 116.0);
  });
});
