/**
 * DELETE /api/order-items/delete-order-item
 *
 * Deletes an order item record from the Order_Items table.
 * - Validates input with Zod.
 * - Checks if order_item_id exists before deleting.
 * - Returns proper errors or success response.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  deleteOrderItemSchema,
  DeleteOrderItemInput,
} from "../validators/deleteOrderItemValidator";
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

    // ✅ Zod validation
    const parsed = deleteOrderItemSchema.safeParse(body);
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

    const input: DeleteOrderItemInput = parsed.data;

    // ✅ Check if order item exists
    const itemCheck = await turso.execute(
      `SELECT order_item_id, order_id FROM Order_Items WHERE order_item_id = ?`,
      [input.order_item_id]
    );

    if (!itemCheck?.rows?.length) {
      return errorResponse(
        {
          error: "NotFound",
          message: `order_item_id ${input.order_item_id} not found`,
        },
        404
      );
    }

    // ✅ Delete order item
    await turso.execute(`DELETE FROM Order_Items WHERE order_item_id = ?`, [
      input.order_item_id,
    ]);

    // Best-effort recalc for this order
    const targetOrderId = (itemCheck.rows?.[0] as any)?.order_id || "";
    if (targetOrderId) {
      try {
        await recalculateOrderTotalDue(targetOrderId);
      } catch (e) {
        console.warn("Recalc after order item delete failed:", e);
      }
    }

    return jsonResponse({ message: "Order item deleted successfully" }, 200);
  } catch (error: any) {
    console.error("Delete order item error:", error);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
