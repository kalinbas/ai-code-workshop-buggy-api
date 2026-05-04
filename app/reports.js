export function revenueByCustomer(orders) {
  const totals = new Map();

  for (const order of orders.values()) {
    const total = order.pricing.total;
    totals.set(order.customerId, (totals.get(order.customerId) ?? 0) + total);
  }

  const rows = [...totals.entries()].map(([customerId, total]) => ({
    customer_id: customerId,
    revenue: Math.round(total * 100) / 100,
  }));

  return {
    rows,
    grand_total: Math.round(rows.reduce((sum, row) => sum + row.revenue, 0) * 100) / 100,
  };
}
