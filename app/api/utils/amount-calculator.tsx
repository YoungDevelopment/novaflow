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
  status: string;
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

  // Tax percentage and committed date from order_config
  const configRes = await turso.execute(
    `
      SELECT COALESCE(tax_percentage, 0) AS tax_percentage, committed_date
      FROM order_config
      WHERE order_id = ?
      LIMIT 1
    `,
    [orderId]
  );
  const taxPercentage = asNumber(configRes?.rows?.[0]?.tax_percentage);
  const committedDate = configRes?.rows?.[0]?.committed_date as string | null;

  // Total items count
  const totalItemsRes = await turso.execute(
    `
      SELECT COUNT(*) AS count
      FROM Order_Items
      WHERE order_id = ?
    `,
    [orderId]
  );
  const totalItems = asNumber(totalItemsRes?.rows?.[0]?.count);

  // Received items count (movement = 'Y')
  const receivedItemsRes = await turso.execute(
    `
      SELECT COUNT(*) AS count
      FROM Order_Items
      WHERE order_id = ? AND movement = 'Y'
    `,
    [orderId]
  );
  const receivedItems = asNumber(receivedItemsRes?.rows?.[0]?.count);

  // Transaction count
  const transactionCountRes = await turso.execute(
    `
      SELECT COUNT(*) AS count
      FROM Order_Transactions
      WHERE Order_ID = ?
    `,
    [orderId]
  );
  const transactionCount = asNumber(transactionCountRes?.rows?.[0]?.count);

  // Business rule: tax on items actual only
  const taxOnItemsActual =
    (itemsActualTotal * Math.max(0, taxPercentage)) / 100;

  const subtotal = itemsActualTotal + chargesTotal;
  const grossTotal = subtotal + taxOnItemsActual;
  const newTotalDue = Math.max(0, grossTotal - paidTotal);

  // Determine status based on priority hierarchy
  let newStatus = "Incomplete";

  if (totalItems > 0) {
    const allReceived = receivedItems === totalItems;
    const someReceived = receivedItems > 0;
    const noneReceived = receivedItems === 0;
    const isOverpaid = paidTotal > grossTotal;
    const isOverdue =
      committedDate &&
      new Date(committedDate) < new Date() &&
      !allReceived;

    // Check Complete first (overrides all other statuses)
    if (allReceived && newTotalDue === 0) {
      newStatus = "Complete";
    }
    // Priority hierarchy: Overdue > Overpaid > Pending Dues > In Progress > Not Received
    else if (isOverdue) {
      newStatus = "Overdue";
    } else if (isOverpaid) {
      newStatus = "Overpaid";
    } else if (someReceived && newTotalDue > 0) {
      newStatus = "Pending Dues";
    } else if (someReceived || transactionCount > 0) {
      newStatus = "In Progress";
    } else if (noneReceived) {
      newStatus = "Not Received";
    }
  }

  await turso.execute(
    `
      UPDATE orders
      SET total_due = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE order_id = ?
    `,
    [newTotalDue, newStatus, orderId]
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
    status: newStatus,
  };
}
