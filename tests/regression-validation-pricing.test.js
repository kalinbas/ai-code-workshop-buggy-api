import assert from "node:assert/strict";
import test from "node:test";
import { auth, withClient } from "./helpers.js";

async function assertRejectedOrder(body) {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body,
    });

    assert.ok([400, 422].includes(response.status));
  });
}

test("[regression:validation] valid order still works", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "BOOK-001", quantity: 2 }] },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.total, 102.44);
  });
});

test("[regression:validation] missing items is rejected", async () => {
  await assertRejectedOrder({});
});

test("[regression:validation] empty items is rejected", async () => {
  await assertRejectedOrder({ items: [] });
});

test("[regression:validation] items must be an array", async () => {
  await assertRejectedOrder({ items: "BOOK-001" });
});

test("[regression:validation] item must be an object", async () => {
  await assertRejectedOrder({ items: [null] });
});

test("[regression:validation] SKU is required", async () => {
  await assertRejectedOrder({ items: [{ quantity: 1 }] });
});

test("[regression:validation] SKU cannot be blank", async () => {
  await assertRejectedOrder({ items: [{ sku: " ", quantity: 1 }] });
});

test("[regression:validation] unknown SKU is rejected", async () => {
  await assertRejectedOrder({ items: [{ sku: "NOPE-999", quantity: 1 }] });
});

test("[regression:validation] quantity must be a number", async () => {
  await assertRejectedOrder({ items: [{ sku: "BOOK-001", quantity: "2" }] });
});

test("[regression:validation] quantity must be an integer", async () => {
  await assertRejectedOrder({ items: [{ sku: "BOOK-001", quantity: 1.5 }] });
});

test("[regression:validation] zero quantity is rejected", async () => {
  await assertRejectedOrder({ items: [{ sku: "BOOK-001", quantity: 0 }] });
});

test("[regression:validation] negative quantity is rejected", async () => {
  await assertRejectedOrder({ items: [{ sku: "BOOK-001", quantity: -3 }] });
});

test("[regression:validation] very large quantity is rejected", async () => {
  await assertRejectedOrder({ items: [{ sku: "BOOK-001", quantity: 1001 }] });
});

test("[regression:validation] multiple valid items can be ordered", async () => {
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

test("[regression:pricing] coupon discounts subtotal and reduces taxable amount", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: {
        coupon: "WELCOME10",
        items: [{ sku: "BOOK-001", quantity: 2 }],
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.discount, 8.4);
    assert.equal(response.body.pricing.tax, 12.1);
    assert.equal(response.body.pricing.total, 92.7);
  });
});

test("[regression:pricing] expired coupon is rejected", async () => {
  await assertRejectedOrder({
    coupon: "EXPIRED20",
    items: [{ sku: "BOOK-001", quantity: 1 }],
  });
});

test("[regression:pricing] invalid coupon is rejected", async () => {
  await assertRejectedOrder({
    coupon: "NOTREAL",
    items: [{ sku: "BOOK-001", quantity: 1 }],
  });
});

test("[regression:pricing] coupon minimum subtotal is enforced", async () => {
  await assertRejectedOrder({
    coupon: "BIGORDER15",
    items: [{ sku: "BOOK-001", quantity: 1 }],
  });
});

test("[regression:pricing] premium free shipping applies at subtotal threshold", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("premium-token-1"),
      body: { items: [{ sku: "KB-003", quantity: 1 }] },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.shipping, 0.0);
    assert.equal(response.body.pricing.total, 116.0);
  });
});

test("[regression:pricing] gift card is not taxed and has no shipping", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "GIFT-CARD", quantity: 1 }] },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.tax, 0.0);
    assert.equal(response.body.pricing.shipping, 0.0);
    assert.equal(response.body.pricing.total, 50.0);
  });
});

test("[regression:pricing] heavy item surcharge applies per unit", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: { items: [{ sku: "KB-003", quantity: 2 }] },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.shipping, 11.0);
    assert.equal(response.body.pricing.total, 243.0);
  });
});

test("[regression:pricing] mixed taxable and non-taxable discount taxes taxable share only", async () => {
  await withClient(async (client) => {
    const response = await client.post("/orders", {
      headers: auth("user-token-1"),
      body: {
        coupon: "WELCOME10",
        items: [
          { sku: "BOOK-001", quantity: 1 },
          { sku: "GIFT-CARD", quantity: 1 },
        ],
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.body.pricing.subtotal, 92.0);
    assert.equal(response.body.pricing.discount, 9.2);
    assert.equal(response.body.pricing.tax, 6.05);
    assert.equal(response.body.pricing.shipping, 5.0);
    assert.equal(response.body.pricing.total, 93.85);
  });
});
