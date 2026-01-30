/**
 * PATCH /api/order-inventory/update-order-inventory
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check inventory_id exists
 *  - If order_id is passed → ensure order exists
 *  - Regenerate barcode_tag if product_code or actual_price_per_unit is updated
 *  - Perform dynamic update & update updated_at
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  updateOrderInventorySchema,
  UpdateOrderInventoryInput,
} from "../validators/updateOrderInventoryValidator";

/**
 * Generate barcode_tag from product_code and actual_price_per_unit
 * Format: "product_code - actual_price_per_unit"
 */
function generateBarcodeTag(
  productCode: string,
  actualPricePerUnit?: number | null
): string | null {
  if (!productCode) return null;
  if (actualPricePerUnit === undefined || actualPricePerUnit === null) {
    return productCode;
  }
  return `${productCode} - ${actualPricePerUnit}`;
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = updateOrderInventorySchema.safeParse(body);
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

    const input: UpdateOrderInventoryInput = parsed.data;

    // 1. Ensure record exists
    const existing = await turso.execute(
      `SELECT * FROM order_inventory WHERE inventory_id = ? LIMIT 1`,
      [input.inventory_id]
    );
    if (existing.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "inventory_id does not exist" },
        404
      );
    }

    const existingRecord = existing.rows[0] as any;

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

    // 3. Determine if barcode_tag needs to be regenerated
    const productCode =
      input.product_code !== undefined
        ? input.product_code
        : existingRecord.product_code;
    const actualPricePerUnit =
      input.actual_price_per_unit !== undefined
        ? input.actual_price_per_unit
        : existingRecord.actual_price_per_unit;

    const shouldUpdateBarcode =
      input.product_code !== undefined ||
      input.actual_price_per_unit !== undefined;

    // 4. Dynamic SQL update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(input).forEach(([key, val]) => {
      if (key !== "inventory_id" && val !== undefined) {
        if (key === "type") {
          fields.push("Type = ?");
          values.push(val);
        } else {
          fields.push(`${key} = ?`);
          values.push(val);
        }
      }
    });

    // Add barcode_tag if needed
    if (shouldUpdateBarcode) {
      const barcodeTag = generateBarcodeTag(productCode, actualPricePerUnit);
      fields.push("barcode_tag = ?");
      values.push(barcodeTag);
    }

    if (fields.length === 0) {
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );
    }

    fields.push("updated_at = CURRENT_TIMESTAMP");
    values.push(input.inventory_id);

    await turso.execute(
      `UPDATE order_inventory SET ${fields.join(", ")} WHERE inventory_id = ?`,
      values
    );

    return jsonResponse(
      { message: "Order inventory updated successfully" },
      200
    );
  } catch (err: any) {
    console.error("Order Inventory Update Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
