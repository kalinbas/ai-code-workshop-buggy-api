from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from json import JSONDecodeError, dumps, loads
from os import environ
from urllib.parse import urlparse
import re
from datetime import date


CATALOG = {
    "BOOK-001": {
        "name": "Clean Code-ish Book",
        "price": 42.0,
        "taxable": True,
        "weightKg": 0.7,
        "shippable": True,
    },
    "USB-002": {
        "name": "USB-C Hub",
        "price": 25.0,
        "taxable": True,
        "weightKg": 0.2,
        "shippable": True,
    },
    "KB-003": {
        "name": "Mechanical Keyboard",
        "price": 100.0,
        "taxable": True,
        "weightKg": 1.4,
        "shippable": True,
    },
    "GIFT-CARD": {
        "name": "Gift Card",
        "price": 50.0,
        "taxable": False,
        "weightKg": 0.0,
        "shippable": False,
    },
}

CUSTOMERS_BY_TOKEN = {
    "user-token-1": {
        "id": "cust_100",
        "name": "Ada",
        "tier": "standard",
        "role": "customer",
        "country": "MX",
    },
    "premium-token-1": {
        "id": "cust_200",
        "name": "Grace",
        "tier": "premium",
        "role": "customer",
        "country": "US",
    },
    "admin-token": {
        "id": "admin_001",
        "name": "Linus",
        "tier": "internal",
        "role": "admin",
        "country": "US",
    },
}

COUPONS = {
    "WELCOME10": {"percent": 10, "expiresOn": "2099-01-01", "minSubtotal": 0},
    "BIGORDER15": {"percent": 15, "expiresOn": "2099-01-01", "minSubtotal": 150},
    "EXPIRED20": {"percent": 20, "expiresOn": "2024-01-01", "minSubtotal": 0},
}

TAX_RATE = 0.16
BASE_SHIPPING = 5.0
HEAVY_ITEM_SURCHARGE = 3.0
ORDERS = {}
AUDIT_LOG = []


class HttpError(Exception):
    def __init__(self, status_code, message):
        super().__init__(message)
        self.status_code = status_code


def round_money(value):
    return round(value + 1e-9, 2)


def get_current_customer(headers):
    authorization = headers.get("Authorization")
    if not authorization:
        raise HttpError(401, "Missing Authorization header")

    match = re.fullmatch(r"Bearer ([^\s]+)", authorization)
    if not match:
        raise HttpError(401, "Malformed Authorization header")

    token = match.group(1)
    customer = CUSTOMERS_BY_TOKEN.get(token)
    if not customer:
        raise HttpError(403, "Invalid token")
    return customer


def require_admin(customer):
    if customer["role"] != "admin":
        raise HttpError(403, "Admin access required")


def is_expired_coupon(coupon):
    return coupon["expiresOn"] < date.today().isoformat()


def validate_order_payload(payload):
    items = payload.get("items")
    if not isinstance(items, list) or len(items) == 0:
        raise HttpError(400, "Order must include at least one item")

    validated_items = []
    for item in items:
        sku = item.get("sku") if isinstance(item, dict) else None
        if not isinstance(sku, str) or sku not in CATALOG:
            raise HttpError(400, "Order contains an unknown SKU")

        quantity = item.get("quantity", 1)
        if (
            not isinstance(quantity, (int, float))
            or isinstance(quantity, bool)
            or quantity <= 0
        ):
            raise HttpError(400, "Item quantity must be a positive number")

        validated_items.append({"sku": sku, "quantity": quantity})

    coupon = payload.get("coupon")
    if coupon is not None:
        if not isinstance(coupon, str):
            raise HttpError(400, "Coupon must be a string")

        coupon_data = COUPONS.get(coupon)
        if coupon_data and is_expired_coupon(coupon_data):
            raise HttpError(400, "Coupon has expired")

    return validated_items, coupon


def calculate_order_total(items, customer, coupon=None):
    subtotal = 0.0
    taxable_subtotal = 0.0
    shipping = 0.0
    has_shippable_items = False
    warnings = []

    for item in items:
        product = CATALOG.get(item["sku"])
        if not product:
            warnings.append(f"Unknown SKU ignored: {item['sku']}")
            continue

        quantity = item.get("quantity", 1)
        line_total = product["price"] * quantity
        subtotal += line_total

        if product["taxable"]:
            taxable_subtotal += line_total

        if product["shippable"]:
            has_shippable_items = True
            if product["weightKg"] > 1:
                shipping += HEAVY_ITEM_SURCHARGE

    if has_shippable_items:
        shipping += BASE_SHIPPING

    discount = 0.0
    if coupon:
        coupon_data = COUPONS.get(coupon)
        if coupon_data:
            if is_expired_coupon(coupon_data):
                warnings.append(f"Expired coupon ignored: {coupon}")
            elif subtotal < coupon_data["minSubtotal"]:
                warnings.append(f"Coupon minimum not met: {coupon}")
            else:
                discount = subtotal * (coupon_data["percent"] / 100)
        else:
            warnings.append(f"Invalid coupon ignored: {coupon}")

    if customer["tier"] == "premium" and subtotal >= 100:
        shipping = 0.0

    taxable_discount = discount * (taxable_subtotal / subtotal) if subtotal > 0 else 0.0
    tax = (taxable_subtotal - taxable_discount) * TAX_RATE
    total = subtotal + tax + shipping - discount

    return {
        "subtotal": round_money(subtotal),
        "tax": round_money(tax),
        "shipping": round_money(shipping),
        "discount": round_money(discount),
        "total": round_money(total),
        "warnings": warnings,
    }


def revenue_by_customer():
    totals = {}
    for order in ORDERS.values():
        customer_id = order["customerId"]
        totals[customer_id] = totals.get(customer_id, 0) + order["pricing"]["total"]

    rows = [
        {"customer_id": customer_id, "revenue": round_money(total)}
        for customer_id, total in totals.items()
    ]
    return {
        "rows": rows,
        "grand_total": round_money(sum(row["revenue"] for row in rows)),
    }


DOCS_HTML = """
<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Demo de Ordenes en Python</title>
    <style>
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: #f4f7fb;
        color: #17202a;
        line-height: 1.45;
      }
      header {
        background: #ffffff;
        border-bottom: 1px solid #d8dee8;
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
      h1, h2, h3, p { margin-top: 0; }
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
      .lead {
        max-width: 720px;
        margin-bottom: 0;
        color: #5f6c7b;
        font-size: 17px;
      }
      .status {
        min-width: 170px;
        border: 1px solid #d8dee8;
        border-radius: 8px;
        padding: 12px 14px;
        background: #f8fafc;
        font-weight: 700;
        text-align: center;
      }
      .status.ok {
        color: #147a57;
        border-color: #9fd5c0;
        background: #effaf5;
      }
      .status.bad {
        color: #a93535;
        border-color: #e6b4b4;
        background: #fff4f4;
      }
      main { padding: 26px 0 36px; }
      .grid {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
        gap: 18px;
        align-items: start;
      }
      .panel {
        background: #ffffff;
        border: 1px solid #d8dee8;
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
        color: #5f6c7b;
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
      }
      select {
        width: 100%;
        min-height: 42px;
        border: 1px solid #b9c3d1;
        border-radius: 6px;
        padding: 9px 10px;
        color: #17202a;
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
        background: #2251a4;
        color: white;
        font: inherit;
        font-weight: 700;
        cursor: pointer;
      }
      button.secondary {
        border-color: #9ba9bb;
        background: #ffffff;
        color: #17202a;
      }
      button.warn {
        border-color: #b77c00;
        background: #fff8e6;
        color: #8a5a00;
      }
      button:disabled {
        cursor: not-allowed;
        opacity: 0.55;
      }
      .result-head {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: center;
        margin-bottom: 12px;
      }
      .pill {
        border: 1px solid #d8dee8;
        border-radius: 999px;
        padding: 5px 9px;
        color: #5f6c7b;
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
      .routes {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }
      .route {
        border: 1px solid #d8dee8;
        border-radius: 8px;
        padding: 12px;
        background: #fbfcfe;
      }
      .method {
        display: inline-block;
        min-width: 48px;
        margin-right: 6px;
        color: #2251a4;
        font-weight: 800;
      }
      .meaning {
        margin: 6px 0 0;
        color: #5f6c7b;
        font-size: 14px;
      }
      .note {
        margin: 14px 0 0;
        color: #5f6c7b;
        font-size: 14px;
      }
      @media (max-width: 820px) {
        .top, .grid, .routes { grid-template-columns: 1fr; }
        .status { text-align: left; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="wrap top">
        <div>
          <h1>Demo de Ordenes en Python</h1>
          <p class="lead">
            Esta pagina muestra una API escrita en Python como si fuera una caja
            registradora sencilla: eliges un cliente, una compra y ves la respuesta real.
          </p>
        </div>
        <div id="healthStatus" class="status">Revisando servidor</div>
      </div>
    </header>
    <main class="wrap">
      <div class="grid">
        <section class="panel">
          <h2>Probar la API</h2>
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
            Si algo esta mal, la API responde con un mensaje: permisos, cupon vencido
            o datos invalidos.
          </p>
        </section>
        <section class="panel">
          <div class="result-head">
            <h2>Respuesta del servidor</h2>
            <span id="lastStatus" class="pill">Sin solicitud</span>
          </div>
          <pre id="output">Haz clic en "Crear orden" para ver una respuesta real.</pre>
        </section>
      </div>
      <section class="panel" style="margin-top: 18px;">
        <h2>Que significa cada ruta</h2>
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
        if (!lastOrderId) return;
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
"""


class OrdersHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.handle_request()

    def do_POST(self):
        self.handle_request()

    def log_message(self, format, *args):
        return

    def handle_request(self):
        try:
            path = urlparse(self.path).path

            if self.command == "GET" and path == "/health":
                self.send_json(200, {"status": "ok"})
                return

            if self.command == "GET" and path == "/docs":
                self.send_html(DOCS_HTML)
                return

            customer = get_current_customer(self.headers)

            if self.command == "POST" and path == "/orders":
                payload = self.read_json()
                items, coupon = validate_order_payload(payload)
                pricing = calculate_order_total(items, customer, coupon)
                order_id = f"ord_{len(ORDERS) + 1}"
                order = {
                    "id": order_id,
                    "customer_id": customer["id"],
                    "customerId": customer["id"],
                    "items": items,
                    "coupon": coupon,
                    "pricing": pricing,
                    "status": "created",
                    "notes": payload.get("notes"),
                }
                ORDERS[order_id] = order
                AUDIT_LOG.append(
                    {
                        "event": "order_created",
                        "orderId": order_id,
                        "customerId": customer["id"],
                    }
                )
                self.send_json(200, order)
                return

            order_match = re.fullmatch(r"/orders/([^/]+)", path)
            if self.command == "GET" and order_match:
                order = ORDERS.get(order_match.group(1))
                if not order:
                    raise HttpError(404, "Order not found")
                if order["customerId"] != customer["id"] and customer["role"] != "admin":
                    raise HttpError(403, "Order access denied")
                self.send_json(200, order)
                return

            refund_match = re.fullmatch(r"/orders/([^/]+)/refund", path)
            if self.command == "POST" and refund_match:
                order = ORDERS.get(refund_match.group(1))
                if not order:
                    raise HttpError(404, "Order not found")
                require_admin(customer)
                payload = self.read_json()
                amount = payload.get("amount") or order["pricing"]["total"]
                order["status"] = "refunded"
                order["refundAmount"] = amount
                order["refundReason"] = payload.get("reason")
                AUDIT_LOG.append(
                    {
                        "event": "order_refunded",
                        "orderId": order["id"],
                        "customerId": customer["id"],
                        "amount": amount,
                    }
                )
                self.send_json(
                    200,
                    {"order_id": order["id"], "status": "refunded", "amount": amount},
                )
                return

            if self.command == "GET" and path == "/reports/revenue":
                require_admin(customer)
                self.send_json(200, revenue_by_customer())
                return

            raise HttpError(404, "Not found")
        except HttpError as error:
            self.send_json(error.status_code, {"detail": str(error)})
        except Exception:
            self.send_json(500, {"detail": "Internal Server Error"})

    def read_json(self):
        length = int(self.headers.get("Content-Length", "0"))
        if length == 0:
            return {}

        try:
            body = self.rfile.read(length).decode("utf-8")
            return loads(body)
        except (UnicodeDecodeError, JSONDecodeError):
            raise HttpError(400, "Invalid JSON body")

    def send_json(self, status_code, body):
        payload = dumps(body).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def send_html(self, html):
        payload = html.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)


def main():
    port = int(environ.get("PORT", "8001"))
    server = ThreadingHTTPServer(("127.0.0.1", port), OrdersHandler)
    print(f"Python server running at http://127.0.0.1:{port}/docs")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer stopped")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
