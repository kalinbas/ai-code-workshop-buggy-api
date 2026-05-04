export const catalog = {
  "BOOK-001": {
    name: "Clean Code-ish Book",
    price: 42.0,
    taxable: true,
    weightKg: 0.7,
    shippable: true,
  },
  "USB-002": {
    name: "USB-C Hub",
    price: 25.0,
    taxable: true,
    weightKg: 0.2,
    shippable: true,
  },
  "KB-003": {
    name: "Mechanical Keyboard",
    price: 100.0,
    taxable: true,
    weightKg: 1.4,
    shippable: true,
  },
  "GIFT-CARD": {
    name: "Gift Card",
    price: 50.0,
    taxable: false,
    weightKg: 0.0,
    shippable: false,
  },
};

export const customersByToken = {
  "user-token-1": {
    id: "cust_100",
    name: "Ada",
    tier: "standard",
    role: "customer",
    country: "MX",
  },
  "premium-token-1": {
    id: "cust_200",
    name: "Grace",
    tier: "premium",
    role: "customer",
    country: "US",
  },
  "admin-token": {
    id: "admin_001",
    name: "Linus",
    tier: "internal",
    role: "admin",
    country: "US",
  },
};

export const coupons = {
  WELCOME10: {
    percent: 10,
    expiresOn: "2099-01-01",
    minSubtotal: 0,
  },
  BIGORDER15: {
    percent: 15,
    expiresOn: "2099-01-01",
    minSubtotal: 150,
  },
  EXPIRED20: {
    percent: 20,
    expiresOn: "2024-01-01",
    minSubtotal: 0,
  },
};

export const orders = new Map();
export const auditLog = [];

export function resetState() {
  orders.clear();
  auditLog.length = 0;
}
