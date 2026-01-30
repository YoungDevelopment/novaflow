/**
 * PATCH /api/order-header/update-order-header
 *
 * Updates only the fields provided in payload.
 * Validates input using Zod validator file.
 * Order ID is required, all other fields are optional.
 * Automatically updates updated_at timestamp.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  updateOrderHeaderSchema,
  UpdateOrderHeaderInput,
} from "../validators/updateOrderHeaderValidator";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );

    // ✅ Validate payload using Zod schema
    const parsed = updateOrderHeaderSchema.safeParse(body);
    if (!parsed.success)
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        400
      );

    const data: UpdateOrderHeaderInput = parsed.data;

    // ✅ Check if order exists
    const exist = await turso.execute(
      "SELECT * FROM orders WHERE order_id = ? LIMIT 1",
      [data.order_id]
    );
    if (exist.rows.length === 0)
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Order with ID ${data.order_id} not found`,
        },
        404
      );

    // ✅ Prepare dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, val]) => {
      if (key !== "order_id" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val === "" ? null : val);
      }
    });

    if (fields.length === 0)
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );

    // ✅ Add timestamp update
    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(data.order_id);

    try {
      await turso.execute(
        `UPDATE orders SET ${fields.join(", ")} WHERE order_id = ?`,
        values
      );
    } catch (updateErr: any) {
      console.error("Order update DB error:", updateErr);
      return errorResponse(
        {
          error: "UpdateError",
          message: "Failed to update order. Please try again later.",
        },
        500
      );
    }

    // ✅ Recalculate total_due and status after update
    // This ensures the order status is always up-to-date after any edit
    try {
      await recalculateOrderTotalDue(data.order_id);
    } catch (recalcErr) {
      console.warn("Recalculate after order update failed:", recalcErr);
    }

    // ✅ Fetch and return the updated order
    const updated = await turso.execute(
      "SELECT * FROM orders WHERE order_id = ? LIMIT 1",
      [data.order_id]
    );

    if (updated.rows.length === 0)
      return errorResponse(
        {
          error: "NotFoundError",
          message: "Order not found after update",
        },
        404
      );

    const order = updated.rows[0];

    // ✅ Return the updated order
    return jsonResponse(
      {
        order_id: order.order_id,
        user: order.user,
        type: order.type,
        company: order.company || "",
        status: order.status,
        total_due: order.total_due,
        entity_id: order.entity_id,
        created_at: order.created_at,
        updated_at: order.updated_at,
      },
      200
    );
  } catch (err: any) {
    console.error("Update order header error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
