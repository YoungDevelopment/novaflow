import { turso } from "@/lib/turso";

export type RecalcResult = {
  order_id: string;
  totals: {
    itemsActualTotal: number;
    chargesTotal: number;
    paidTotal: number;
    taxPercentage: number;
    taxOnItemsActual: number;
    subtotal: number;
  };
  total_due: number;
};

function asNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return isFinite(value) ? value : 0;
  const parsed = parseFloat(String(value));
  return isFinite(parsed) ? parsed : 0;
}

export async function recalculateOrderTotalDue(
  orderId: string
): Promise<RecalcResult> {
  // Ensure order exists
  const exist = await turso.execute(
    "SELECT order_id FROM orders WHERE order_id = ? LIMIT 1",
    [orderId]
  );
  if (exist.rows.length === 0) {
    throw new Error(`Order with ID ${orderId} not found`);
  }

  // Items actual sum
  const itemsActualRes = await turso.execute(
    `
      SELECT COALESCE(SUM(actual_amount), 0) AS total
      FROM Order_Items
      WHERE order_id = ?
    `,
    [orderId]
  );
  const itemsActualTotal = asNumber(itemsActualRes?.rows?.[0]?.total);

  // Charges sum
  const chargesRes = await turso.execute(
    `
      SELECT COALESCE(SUM(Charges), 0) AS total
      FROM Order_Charges
      WHERE Order_ID = ?
    `,
    [orderId]
  );
  const chargesTotal = asNumber(chargesRes?.rows?.[0]?.total);

  // Paid transactions sum
  const paidRes = await turso.execute(
    `
      SELECT COALESCE(SUM(Actual_Amount), 0) AS total
      FROM Order_Transactions
      WHERE Order_ID = ?
       
    `,
    [orderId]
  );
  const paidTotal = asNumber(paidRes?.rows?.[0]?.total);

  // Tax percentage
  const taxRes = await turso.execute(
    `
      SELECT COALESCE(tax_percentage, 0) AS tax_percentage
      FROM order_config
      WHERE order_id = ?
      LIMIT 1
    `,
    [orderId]
  );
  const taxPercentage = asNumber(taxRes?.rows?.[0]?.tax_percentage);

  // Business rule: tax on items actual only
  const taxOnItemsActual =
    (itemsActualTotal * Math.max(0, taxPercentage)) / 100;

  const subtotal = itemsActualTotal + chargesTotal;
  const newTotalDue = Math.max(0, subtotal + taxOnItemsActual - paidTotal);

  await turso.execute(
    `
      UPDATE orders
      SET total_due = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `,
    [newTotalDue, orderId]
  );

  return {
    order_id: orderId,
    totals: {
      itemsActualTotal,
      chargesTotal,
      paidTotal,
      taxPercentage,
      taxOnItemsActual,
      subtotal,
    },
    total_due: newTotalDue,
  };
}
