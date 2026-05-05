import { createServer as createHttpServer } from "node:http";
import { fileURLToPath } from "node:url";
import { getCurrentCustomer, requireAdmin } from "./auth.js";
import { auditLog, catalog, coupons, orders } from "./data.js";
import { HttpError } from "./http-error.js";
import { calculateOrderTotal } from "./pricing.js";
import { revenueByCustomer } from "./reports.js";

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
  }
  try {
    return body ? JSON.parse(body) : {};
  } catch {
    throw new HttpError(400, "Invalid JSON body");
  }
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, { "content-type": "application/json" });
  response.end(JSON.stringify(body));
}

function sendDocs(response) {
  response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
  response.end(`
    <!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Demo de Ordenes</title>
        <style>
          :root {
            color-scheme: light;
            --ink: #17202a;
            --muted: #5f6c7b;
            --line: #d8dee8;
            --paper: #ffffff;
            --wash: #f4f7fb;
            --green: #147a57;
            --blue: #2251a4;
            --red: #a93535;
            --amber: #8a5a00;
          }

          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            font-family: Arial, Helvetica, sans-serif;
            background: var(--wash);
            color: var(--ink);
            line-height: 1.45;
          }

          header {
            background: var(--paper);
            border-bottom: 1px solid var(--line);
          }

          .wrap {
            width: min(1120px, calc(100% - 32px));
            margin: 0 auto;
          }

          .top {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 20px;
            align-items: center;
            padding: 28px 0;
          }

          h1,
          h2,
          h3,
          p {
            margin-top: 0;
          }

          h1 {
            margin-bottom: 8px;
            font-size: clamp(28px, 4vw, 44px);
            letter-spacing: 0;
          }

          h2 {
            margin-bottom: 12px;
            font-size: 22px;
            letter-spacing: 0;
          }

          h3 {
            margin-bottom: 8px;
            font-size: 17px;
            letter-spacing: 0;
          }

          .lead {
            max-width: 720px;
            margin-bottom: 0;
            color: var(--muted);
            font-size: 17px;
          }

          .status {
            min-width: 170px;
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 12px 14px;
            background: #f8fafc;
            font-weight: 700;
            text-align: center;
          }

          .status.ok {
            color: var(--green);
            border-color: #9fd5c0;
            background: #effaf5;
          }

          .status.bad {
            color: var(--red);
            border-color: #e6b4b4;
            background: #fff4f4;
          }

          main {
            padding: 26px 0 36px;
          }

          .grid {
            display: grid;
            grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
            gap: 18px;
            align-items: start;
          }

          .panel {
            background: var(--paper);
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 18px;
          }

          .steps {
            display: grid;
            gap: 14px;
          }

          .step {
            display: grid;
            gap: 8px;
          }

          label {
            display: block;
            color: var(--muted);
            font-size: 13px;
            font-weight: 700;
            text-transform: uppercase;
          }

          select,
          input {
            width: 100%;
            min-height: 42px;
            border: 1px solid #b9c3d1;
            border-radius: 6px;
            padding: 9px 10px;
            color: var(--ink);
            background: #ffffff;
            font: inherit;
          }

          .actions {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-top: 16px;
          }

          button {
            min-height: 42px;
            border: 1px solid #1f3f7f;
            border-radius: 6px;
            padding: 9px 13px;
            background: var(--blue);
            color: white;
            font: inherit;
            font-weight: 700;
            cursor: pointer;
          }

          button.secondary {
            border-color: #9ba9bb;
            background: #ffffff;
            color: var(--ink);
          }

          button.warn {
            border-color: #b77c00;
            background: #fff8e6;
            color: var(--amber);
          }

          button:disabled {
            cursor: not-allowed;
            opacity: 0.55;
          }

          .routes {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 14px;
          }

          .route {
            border: 1px solid var(--line);
            border-radius: 8px;
            padding: 12px;
            background: #fbfcfe;
          }

          .method {
            display: inline-block;
            min-width: 48px;
            margin-right: 6px;
            color: var(--blue);
            font-weight: 800;
          }

          .meaning {
            margin: 6px 0 0;
            color: var(--muted);
            font-size: 14px;
          }

          .result-head {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            align-items: center;
            margin-bottom: 12px;
          }

          .pill {
            border: 1px solid var(--line);
            border-radius: 999px;
            padding: 5px 9px;
            color: var(--muted);
            background: #f8fafc;
            font-size: 13px;
            font-weight: 700;
          }

          pre {
            min-height: 320px;
            margin: 0;
            overflow: auto;
            border-radius: 8px;
            padding: 14px;
            background: #121821;
            color: #e8edf5;
            font-size: 14px;
            white-space: pre-wrap;
            word-break: break-word;
          }

          .note {
            margin: 14px 0 0;
            color: var(--muted);
            font-size: 14px;
          }

          @media (max-width: 820px) {
            .top,
            .grid {
              grid-template-columns: 1fr;
            }

            .status {
              text-align: left;
            }

            .routes {
              grid-template-columns: 1fr;
            }
          }
        </style>
      </head>
      <body>
        <header>
          <div class="wrap top">
            <div>
              <h1>Demo de Ordenes</h1>
              <p class="lead">
                Esta pagina muestra la API como si fuera una caja registradora sencilla:
                eliges un cliente, eliges una compra y ves la respuesta real del servidor.
              </p>
            </div>
            <div id="healthStatus" class="status">Revisando servidor</div>
          </div>
        </header>

        <main class="wrap">
          <div class="grid">
            <section class="panel" aria-labelledby="try-api-title">
              <h2 id="try-api-title">Probar la API</h2>
              <div class="steps">
                <div class="step">
                  <label for="token">Cliente</label>
                  <select id="token">
                    <option value="user-token-1">Ada, cliente normal</option>
                    <option value="premium-token-1">Grace, cliente premium</option>
                    <option value="admin-token">Linus, administrador</option>
                  </select>
                </div>

                <div class="step">
                  <label for="preset">Compra</label>
                  <select id="preset">
                    <option value="books">2 libros</option>
                    <option value="keyboard">1 teclado mecanico</option>
                    <option value="gift">1 tarjeta de regalo</option>
                    <option value="badSku">Producto que no existe</option>
                    <option value="badQuantity">Cantidad invalida</option>
                  </select>
                </div>

                <div class="step">
                  <label for="coupon">Cupon</label>
                  <select id="coupon">
                    <option value="">Sin cupon</option>
                    <option value="WELCOME10">WELCOME10, 10% de descuento</option>
                    <option value="BIGORDER15">BIGORDER15, compra grande</option>
                    <option value="EXPIRED20">EXPIRED20, cupon expirado</option>
                  </select>
                </div>
              </div>

              <div class="actions">
                <button id="createOrder">Crear orden</button>
                <button id="readOrder" class="secondary" disabled>Leer ultima orden</button>
                <button id="healthCheck" class="secondary">Ver salud</button>
                <button id="adminReport" class="warn">Reporte admin</button>
              </div>

              <p class="note">
                Si una prueba falla, eso tambien es informacion: la API te dira si faltan
                permisos, si el cupon expiro o si la orden no es valida.
              </p>
            </section>

            <section class="panel" aria-labelledby="response-title">
              <div class="result-head">
                <h2 id="response-title">Respuesta del servidor</h2>
                <span id="lastStatus" class="pill">Sin solicitud</span>
              </div>
              <pre id="output">Haz clic en "Crear orden" para ver una respuesta real.</pre>
            </section>
          </div>

          <section class="panel" style="margin-top: 18px;" aria-labelledby="routes-title">
            <h2 id="routes-title">Que significa cada ruta</h2>
            <div class="routes">
              <div class="route">
                <strong><span class="method">GET</span>/health</strong>
                <p class="meaning">Dice si el servidor esta encendido.</p>
              </div>
              <div class="route">
                <strong><span class="method">POST</span>/orders</strong>
                <p class="meaning">Crea una orden con productos del catalogo.</p>
              </div>
              <div class="route">
                <strong><span class="method">GET</span>/orders/:id</strong>
                <p class="meaning">Consulta una orden existente por su identificador.</p>
              </div>
              <div class="route">
                <strong><span class="method">POST</span>/orders/:id/refund</strong>
                <p class="meaning">Devuelve una orden. Solo lo puede hacer un admin.</p>
              </div>
              <div class="route">
                <strong><span class="method">GET</span>/reports/revenue</strong>
                <p class="meaning">Muestra ingresos acumulados. Solo lo puede ver un admin.</p>
              </div>
            </div>
          </section>
        </main>

        <script>
          const presets = {
            books: [{ sku: "BOOK-001", quantity: 2 }],
            keyboard: [{ sku: "KB-003", quantity: 1 }],
            gift: [{ sku: "GIFT-CARD", quantity: 1 }],
            badSku: [{ sku: "NOPE-999", quantity: 1 }],
            badQuantity: [{ sku: "BOOK-001", quantity: -3 }],
          };

          const token = document.querySelector("#token");
          const preset = document.querySelector("#preset");
          const coupon = document.querySelector("#coupon");
          const output = document.querySelector("#output");
          const lastStatus = document.querySelector("#lastStatus");
          const readOrder = document.querySelector("#readOrder");
          const healthStatus = document.querySelector("#healthStatus");
          let lastOrderId = null;

          function authHeaders() {
            return {
              "content-type": "application/json",
              Authorization: "Bearer " + token.value,
            };
          }

          function show(label, status, body) {
            lastStatus.textContent = label + " - HTTP " + status;
            output.textContent = JSON.stringify(body, null, 2);
          }

          async function parseJson(response) {
            try {
              return await response.json();
            } catch {
              return { detail: "La respuesta no fue JSON." };
            }
          }

          async function request(label, path, options) {
            try {
              const response = await fetch(path, options);
              const body = await parseJson(response);
              show(label, response.status, body);
              return { response, body };
            } catch (error) {
              lastStatus.textContent = label + " - error";
              output.textContent = error.message;
              return null;
            }
          }

          async function checkHealth() {
            const result = await request("Salud", "/health", { method: "GET" });
            if (result && result.response.ok) {
              healthStatus.textContent = "Servidor encendido";
              healthStatus.className = "status ok";
            } else {
              healthStatus.textContent = "Servidor con problema";
              healthStatus.className = "status bad";
            }
          }

          document.querySelector("#createOrder").addEventListener("click", async () => {
            const body = { items: presets[preset.value] };
            if (coupon.value) {
              body.coupon = coupon.value;
            }

            const result = await request("Crear orden", "/orders", {
              method: "POST",
              headers: authHeaders(),
              body: JSON.stringify(body),
            });

            if (result && result.response.ok && result.body.id) {
              lastOrderId = result.body.id;
              readOrder.disabled = false;
            }
          });

          readOrder.addEventListener("click", () => {
            if (!lastOrderId) {
              return;
            }

            request("Leer orden", "/orders/" + lastOrderId, {
              method: "GET",
              headers: authHeaders(),
            });
          });

          document.querySelector("#healthCheck").addEventListener("click", checkHealth);

          document.querySelector("#adminReport").addEventListener("click", () => {
            request("Reporte", "/reports/revenue", {
              method: "GET",
              headers: authHeaders(),
            });
          });

          checkHealth();
        </script>
      </body>
    </html>
  `);
}

function isExpiredCoupon(coupon, today = new Date()) {
  return coupon.expiresOn < today.toISOString().slice(0, 10);
}

function validateOrderPayload(payload) {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new HttpError(400, "Order must include at least one item");
  }

  const items = payload.items.map((item) => {
    const sku = item?.sku;
    if (typeof sku !== "string" || !catalog[sku]) {
      throw new HttpError(400, "Order contains an unknown SKU");
    }

    const quantity = item.quantity === undefined ? 1 : item.quantity;
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0) {
      throw new HttpError(400, "Item quantity must be a positive number");
    }

    return { sku, quantity };
  });

  const coupon = payload.coupon ?? null;
  if (coupon !== null) {
    if (typeof coupon !== "string") {
      throw new HttpError(400, "Coupon must be a string");
    }

    const couponData = coupons[coupon];
    if (couponData && isExpiredCoupon(couponData)) {
      throw new HttpError(400, "Coupon has expired");
    }
  }

  return { items, coupon };
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
    const { items, coupon } = validateOrderPayload(payload);
    const pricing = calculateOrderTotal(items, customer, coupon);

    const orderId = `ord_${orders.size + 1}`;
    const order = {
      id: orderId,
      customer_id: customer.id,
      customerId: customer.id,
      items,
      coupon,
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

    if (order.customerId !== customer.id && customer.role !== "admin") {
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
    const amount = payload.amount || order.pricing.total;
    order.status = "refunded";
    order.refundAmount = amount;
    order.refundReason = payload.reason ?? null;
    auditLog.push({ event: "order_refunded", orderId: order.id, customerId: customer.id, amount });
    return sendJson(response, 200, { order_id: order.id, status: "refunded", amount });
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
