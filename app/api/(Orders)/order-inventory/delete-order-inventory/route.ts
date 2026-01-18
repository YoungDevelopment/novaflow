/**
 * DELETE /api/order-inventory/delete-order-inventory
 *
 * Deletes an order inventory record from the order_inventory table.
 * - Validates input with Zod.
 * - Checks if inventory_id exists before deleting.
 * - Returns proper errors or success response.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  deleteOrderInventorySchema,
  DeleteOrderInventoryInput,
} from "../validators/deleteOrderInventoryValidator";

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
    const parsed = deleteOrderInventorySchema.safeParse(body);
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

    const input: DeleteOrderInventoryInput = parsed.data;

    // ✅ Check if order inventory exists
    const inventoryCheck = await turso.execute(
      `SELECT inventory_id FROM order_inventory WHERE inventory_id = ?`,
      [input.inventory_id]
    );

    if (!inventoryCheck?.rows?.length) {
      return errorResponse(
        {
          error: "NotFound",
          message: `inventory_id ${input.inventory_id} not found`,
        },
        404
      );
    }

    // ✅ Delete order inventory
    await turso.execute(`DELETE FROM order_inventory WHERE inventory_id = ?`, [
      input.inventory_id,
    ]);

    return jsonResponse(
      { message: "Order inventory deleted successfully" },
      200
    );
  } catch (err: any) {
    console.error("Order Inventory Delete Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
