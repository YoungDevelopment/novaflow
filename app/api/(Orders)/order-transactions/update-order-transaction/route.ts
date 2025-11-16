/**
 * PATCH /api/order-transactions/update-order-transaction
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Order_Transcation_ID exists
 *  - If Order_ID is passed → ensure order exists
 *  - Perform dynamic update & update updated_at
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  updateOrderTransactionSchema,
  UpdateOrderTransactionInput,
} from "../validators/updateOrderTransactionValidator";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = updateOrderTransactionSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const input: UpdateOrderTransactionInput = parsed.data;

    // 1. Ensure record exists
    const existing = await turso.execute(
      `SELECT * FROM Order_Transactions WHERE Order_Transcation_ID = ? LIMIT 1`,
      [input.Order_Transcation_ID]
    );
    if (existing.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Order_Transcation_ID does not exist" },
        404
      );
    }

    // 2. If Order_ID is provided → validate it exists
    if (input.Order_ID) {
      const orderCheck = await turso.execute(
        `SELECT order_id FROM orders WHERE order_id = ? LIMIT 1`,
        [input.Order_ID]
      );
      if (orderCheck.rows.length === 0) {
        return errorResponse(
          { error: "NotFound", message: "Order_ID does not exist" },
          404
        );
      }
    }

    // 3. Dynamic SQL update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(input).forEach(([key, val]) => {
      if (key !== "Order_Transcation_ID" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });

    if (fields.length === 0) {
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(input.Order_Transcation_ID);

    await turso.execute(
      `UPDATE Order_Transactions SET ${fields.join(
        ", "
      )} WHERE Order_Transcation_ID = ?`,
      values
    );

    // Determine order id to recalc
    const targetOrderId =
      input.Order_ID || (existing.rows?.[0] as any)?.Order_ID || "";
    if (targetOrderId) {
      try {
        await recalculateOrderTotalDue(targetOrderId);
      } catch (e) {
        console.warn("Recalc after transaction update failed:", e);
      }
    }

    return jsonResponse(
      { message: "Order transaction updated successfully" },
      200
    );
  } catch (err: any) {
    console.error("Order Transaction Update Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
