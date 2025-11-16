/**
 * PATCH /api/order-charges/update-order-charge
 *
 * - Validate body with Zod (all fields mandatory)
 * - Ensure Order_Charges_ID exists
 * - Ensure Order_ID exists
 * - Update the record
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  updateOrderChargeSchema,
  UpdateOrderChargeInput,
} from "../validators/updateOrderChargeValidator";
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

    const parsed = updateOrderChargeSchema.safeParse(body);
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

    const input: UpdateOrderChargeInput = parsed.data;

    // Ensure record exists
    const existing = await turso.execute(
      `SELECT Order_Charges_ID FROM Order_Charges WHERE Order_Charges_ID = ? LIMIT 1`,
      [input.Order_Charges_ID]
    );
    if (existing.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Order_Charges_ID does not exist" },
        404
      );
    }

    // Ensure Order exists
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

    await turso.execute({
      sql: `UPDATE Order_Charges
            SET Order_ID = ?, Description = ?, Charges = ?
            WHERE Order_Charges_ID = ?`,
      args: [
        input.Order_ID,
        input.Description,
        input.Charges,
        input.Order_Charges_ID,
      ],
    });

    // Best-effort recalc
    try {
      await recalculateOrderTotalDue(input.Order_ID);
    } catch (e) {
      console.warn("Recalc after charge update failed:", e);
    }

    return jsonResponse({ message: "Order charge updated successfully" }, 200);
  } catch (error: any) {
    console.error("Update order charge error:", error);
    return errorResponse(
      {
        error: "ServerError",
        message: "Failed to update order charge",
        details: error?.message,
      },
      500
    );
  }
}
