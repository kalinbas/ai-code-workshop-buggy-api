import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { getCurrentCustomer, requireAdmin } from "./auth.js";
import { auditLog, catalog, orders } from "./data.js";
import { HttpError } from "./http-error.js";
import { calculateOrderTotal } from "./pricing.js";
import { revenueByCustomer } from "./reports.js";

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }

  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body);
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function sendDocs(response) {
  response.writeHead(200, { "content-type": "text/html" });
  response.end(`
    <title>AI Workshop Broken Orders API</title>
    <h1>AI Workshop Broken Orders API</h1>
    <p>Available routes: GET /health, POST /orders, GET /orders/:id,
    POST /orders/:id/refund, GET /reports/revenue.</p>
  `);
}

async function handleRequest(request, response) {
  const url = new URL(request.url, "http://localhost");

  if (request.method === "GET" && url.pathname === "/health") {
    return sendJson(response, 200, { status: "ok" });
  }

  if (request.method === "GET" && url.pathname === "/docs") {
    return sendDocs(response);
  }

  const customer = getCurrentCustomer(request.headers);

  if (request.method === "POST" && url.pathname === "/orders") {
    const payload = await readJson(request);

    if (!Array.isArray(payload.items) || payload.items.length === 0) {
      throw new HttpError(400, "Order must include at least one item");
    }

    for (const item of payload.items) {
      if (!item || typeof item !== "object") {
        throw new HttpError(400, "Each item must be an object");
      }

      if (typeof item.sku !== "string" || item.sku.trim() === "") {
        throw new HttpError(400, "SKU is required");
      }

      if (!catalog[item.sku]) {
        throw new HttpError(400, `Unknown SKU: ${item.sku}`);
      }

      const quantity = item.quantity === undefined ? 1 : item.quantity;
      if (typeof quantity !== "number") {
        throw new HttpError(400, "Quantity must be a number");
      }

      if (!Number.isInteger(quantity)) {
        throw new HttpError(400, "Quantity must be an integer");
      }

      if (quantity <= 0) {
        throw new HttpError(400, "Quantity must be greater than zero");
      }

      if (quantity > 1000) {
        throw new HttpError(400, "Quantity is too large");
      }
    }

    const items = payload.items.map((item) => ({
      sku: item.sku,
      quantity: item.quantity ?? 1,
    }));
    const pricing = calculateOrderTotal(items, customer, payload.coupon);

    const orderId = `ord_${orders.size + 1}`;
    const order = {
      id: orderId,
      customer_id: customer.id,
      customerId: customer.id,
      items,
      coupon: payload.coupon ?? null,
      pricing,
      status: "created",
      notes: payload.notes ?? null,
    };
    orders.set(orderId, order);
    auditLog.push({ event: "order_created", orderId, customerId: customer.id });
    return sendJson(response, 200, order);
  }

  const orderMatch = url.pathname.match(/^\/orders\/([^/]+)$/);
  if (request.method === "GET" && orderMatch) {
    const order = orders.get(orderMatch[1]);
    if (!order) throw new HttpError(404, "Order not found");

    if (customer.role !== "admin" && order.customerId !== customer.id) {
      throw new HttpError(403, "Order access denied");
    }

    return sendJson(response, 200, order);
  }

  const refundMatch = url.pathname.match(/^\/orders\/([^/]+)\/refund$/);
  if (request.method === "POST" && refundMatch) {
    const order = orders.get(refundMatch[1]);
    if (!order) throw new HttpError(404, "Order not found");

    requireAdmin(customer);

    const payload = await readJson(request);
    const amount = payload.amount ?? order.pricing.total;
    if (typeof amount !== "number") {
      throw new HttpError(400, "Refund amount must be a number");
    }

    if (amount <= 0) {
      throw new HttpError(400, "Refund amount must be greater than zero");
    }

    const refundedAmount = order.refundedAmount ?? 0;
    if (refundedAmount + amount > order.pricing.total) {
      throw new HttpError(400, "Refund amount cannot exceed remaining order total");
    }

    order.refundedAmount = refundedAmount + amount;
    order.status = order.refundedAmount === order.pricing.total ? "refunded" : "partially_refunded";
    order.refundAmount = amount;
    order.refundReason = payload.reason ?? null;
    auditLog.push({ event: "order_refunded", orderId: order.id, customerId: customer.id, amount });
    return sendJson(response, 200, {
      order_id: order.id,
      status: order.status,
      amount,
      refunded_amount: order.refundedAmount,
    });
  }

  if (request.method === "GET" && url.pathname === "/reports/revenue") {
    requireAdmin(customer);
    return sendJson(response, 200, revenueByCustomer(orders));
  }

  throw new HttpError(404, "Not found");
}

export function createApp() {
  return createHttpServer(async (request, response) => {
    try {
      await handleRequest(request, response);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(response, error.statusCode, { detail: error.message });
      } else {
        sendJson(response, 500, { detail: "Internal Server Error" });
      }
    }
  });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const port = Number(process.env.PORT ?? 8000);
  createApp().listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}`);
  });
}
