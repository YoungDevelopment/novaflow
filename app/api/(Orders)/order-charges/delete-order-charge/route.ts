/**
 * DELETE /api/order-charges/delete-order-charge
 *
 * - Validate body with Zod
 * - Ensure Order_Charges_ID exists
 * - Delete record
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  deleteOrderChargeSchema,
  DeleteOrderChargeInput,
} from "../validators/deleteOrderChargeValidator";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = deleteOrderChargeSchema.safeParse(body);
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

    const input: DeleteOrderChargeInput = parsed.data;

    const existing = await turso.execute(
      `SELECT Order_Charges_ID, Order_ID FROM Order_Charges WHERE Order_Charges_ID = ? LIMIT 1`,
      [input.Order_Charges_ID]
    );
    if (existing.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFound",
          message: `Order_Charges_ID ${input.Order_Charges_ID} not found`,
        },
        404
      );
    }

    await turso.execute({
      sql: `DELETE FROM Order_Charges WHERE Order_Charges_ID = ?`,
      args: [input.Order_Charges_ID],
    });

    // Best-effort recalc
    const targetOrderId = (existing.rows?.[0] as any)?.Order_ID || "";
    if (targetOrderId) {
      try {
        await recalculateOrderTotalDue(targetOrderId);
      } catch (e) {
        console.warn("Recalc after charge delete failed:", e);
      }
    }

    return jsonResponse({ message: "Order charge deleted successfully" }, 200);
  } catch (error: any) {
    console.error("Delete order charge error:", error);
    return errorResponse(
      {
        error: "ServerError",
        message: "Failed to delete order charge",
        details: error?.message,
      },
      500
    );
  }
}
