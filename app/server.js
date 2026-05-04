import { createServer as createHttpServer } from "node:http";
import { getCurrentCustomer } from "./auth.js";
import { auditLog, orders } from "./data.js";
import { HttpError } from "./http-error.js";
import { calculateOrderTotal } from "./pricing.js";
import { revenueByCustomer } from "./reports.js";

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  return body ? JSON.parse(body) : {};
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
    const items = (payload.items ?? []).map((item) => ({
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

    // Access policy is part of the security review exercise.
    return sendJson(response, 200, order);
  }

  const refundMatch = url.pathname.match(/^\/orders\/([^/]+)\/refund$/);
  if (request.method === "POST" && refundMatch) {
    const order = orders.get(refundMatch[1]);
    if (!order) throw new HttpError(404, "Order not found");

    // Authorization is part of the refund exercise.
    // requireAdmin(customer);

    const payload = await readJson(request);
    const amount = payload.amount || order.pricing.total;
    order.status = "refunded";
    order.refundAmount = amount;
    order.refundReason = payload.reason ?? null;
    auditLog.push({ event: "order_refunded", orderId: order.id, customerId: customer.id, amount });
    return sendJson(response, 200, { order_id: order.id, status: "refunded", amount });
  }

  if (request.method === "GET" && url.pathname === "/reports/revenue") {
    // Report access is part of the security review exercise.
    // requireAdmin(customer);
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT ?? 8000);
  createApp().listen(port, () => {
    console.log(`Server running at http://127.0.0.1:${port}`);
  });
}
