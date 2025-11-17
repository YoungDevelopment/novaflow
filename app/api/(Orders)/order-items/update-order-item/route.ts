/**
 * PATCH /api/order-items/update-order-item
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check order_item_id exists
 *  - If order_id is passed → ensure order exists
 *  - Perform dynamic update & update updated_at
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  updateOrderItemSchema,
  UpdateOrderItemInput,
} from "../validators/updateOrderItemValidator";
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

    const parsed = updateOrderItemSchema.safeParse(body);
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

    const input: UpdateOrderItemInput = parsed.data;

    // 1. Ensure record exists
    const existing = await turso.execute(
      `SELECT * FROM Order_Items WHERE order_item_id = ? LIMIT 1`,
      [input.order_item_id]
    );
    if (existing.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "order_item_id does not exist" },
        404
      );
    }

    // 2. If order_id is provided → validate it exists
    if (input.order_id) {
      const orderCheck = await turso.execute(
        `SELECT order_id FROM orders WHERE order_id = ? LIMIT 1`,
        [input.order_id]
      );
      if (orderCheck.rows.length === 0) {
        return errorResponse(
          { error: "NotFound", message: "order_id does not exist" },
          404
        );
      }
    }

    // 3. Check if we need to recalculate amounts server-side
    // If price or quantity fields are being updated, recalculate amounts
    const existingRow = existing.rows[0] as any;
    const needsAmountRecalc =
      (input.declared_price_per_unit !== undefined ||
        input.declared_price_per_kg !== undefined ||
        input.actual_price_per_unit !== undefined ||
        input.actual_price_per_kg !== undefined ||
        input.unit !== undefined ||
        input.kg !== undefined) &&
      (input.declared_amount === undefined ||
        input.actual_amount === undefined);

    // If we need to recalculate, fetch current values
    let recalculatedDeclaredAmount = input.declared_amount;
    let recalculatedActualAmount = input.actual_amount;

    if (needsAmountRecalc) {
      const unit =
        input.unit !== undefined ? input.unit : existingRow?.unit ?? 0;
      const kg = input.kg !== undefined ? input.kg : existingRow?.kg ?? 0;
      const declaredPpu =
        input.declared_price_per_unit !== undefined
          ? input.declared_price_per_unit
          : existingRow?.declared_price_per_unit ?? 0;
      const declaredPpk =
        input.declared_price_per_kg !== undefined
          ? input.declared_price_per_kg
          : existingRow?.declared_price_per_kg ?? 0;
      const actualPpu =
        input.actual_price_per_unit !== undefined
          ? input.actual_price_per_unit
          : existingRow?.actual_price_per_unit ?? 0;
      const actualPpk =
        input.actual_price_per_kg !== undefined
          ? input.actual_price_per_kg
          : existingRow?.actual_price_per_kg ?? 0;

      // Calculate: (unit * price_per_unit) + (kg * price_per_kg)
      const toNum = (val: any) => {
        if (val === null || val === undefined) return 0;
        const n = typeof val === "number" ? val : parseFloat(String(val));
        return Number.isFinite(n) ? n : 0;
      };

      const unitNum = toNum(unit);
      const kgNum = toNum(kg);
      const declaredPpuNum = toNum(declaredPpu);
      const declaredPpkNum = toNum(declaredPpk);
      const actualPpuNum = toNum(actualPpu);
      const actualPpkNum = toNum(actualPpk);

      if (input.declared_amount === undefined) {
        recalculatedDeclaredAmount =
          unitNum * declaredPpuNum + kgNum * declaredPpkNum;
      }
      if (input.actual_amount === undefined) {
        recalculatedActualAmount =
          unitNum * actualPpuNum + kgNum * actualPpkNum;
      }
    }

    // 4. Dynamic SQL update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(input).forEach(([key, val]) => {
      if (key !== "order_item_id" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });

    // Add recalculated amounts if they were computed
    if (needsAmountRecalc) {
      if (
        input.declared_amount === undefined &&
        recalculatedDeclaredAmount !== undefined
      ) {
        fields.push(`declared_amount = ?`);
        values.push(recalculatedDeclaredAmount);
      }
      if (
        input.actual_amount === undefined &&
        recalculatedActualAmount !== undefined
      ) {
        fields.push(`actual_amount = ?`);
        values.push(recalculatedActualAmount);
      }
    }

    if (fields.length === 0) {
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(input.order_item_id);

    await turso.execute(
      `UPDATE Order_Items SET ${fields.join(", ")} WHERE order_item_id = ?`,
      values
    );

    // Determine order_id for recalc (prefer input.order_id, fallback to existing row)
    const targetOrderId =
      input.order_id || (existing.rows?.[0] as any)?.order_id || "";
    if (targetOrderId) {
      try {
        await recalculateOrderTotalDue(targetOrderId);
      } catch (e) {
        console.warn("Recalc after order item update failed:", e);
      }
    }

    return jsonResponse({ message: "Order item updated successfully" }, 200);
  } catch (err: any) {
    console.error("Order Item Update Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
