/**
 * POST /api/order-header/recalculate-total-due
 *
 * Body:
 * {
 *   "order_id": "ORD-1"
 * }
 *
 * Recalculates orders.total_due as:
 *   (SUM(Order_Items.actual_amount) + SUM(Order_Charges.Charges)) - SUM(Paid Transactions)
 *
 * "Paid Transactions" are determined by:
 *   - Type ILIKE 'payment' OR
 *   - Order_Payment_Type ILIKE 'paid' OR 'payment'
 *
 * Returns the updated totals and the new total_due.
 */
import { NextRequest } from "next/server";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (
      !body ||
      typeof body?.order_id !== "string" ||
      body.order_id.trim() === ""
    ) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "order_id is required",
        },
        400
      );
    }

    const orderId = body.order_id.trim();

    const result = await recalculateOrderTotalDue(orderId);

    return jsonResponse(
      { ...result, message: "Order total_due recalculated successfully" },
      200
    );
  } catch (err: any) {
    console.error("Recalculate total_due error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
