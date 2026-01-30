/**
 * POST /api/order-inventory/create-order-inventory
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check order_id exists in orders table
 *  - Generate inventory_id using id-generator.ts (Prefix: INV)
 *  - Generate barcode_tag from product_code and actual_price_per_unit
 *  - Insert into order_inventory table
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createOrderInventorySchema,
  CreateOrderInventoryInput,
} from "../validators/createOrderInventoryValidator";

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = createOrderInventorySchema.safeParse(body);
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

    const input: CreateOrderInventoryInput = parsed.data;

    // 1. Check order exists
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

    // 2. Generate inventory_id (Prefix: INV)
    const newInventoryId = await generateCustomId({
      tableName: "order_inventory",
      idColumnName: "inventory_id",
      prefix: "INV",
    });

    // 3. Generate barcode_tag
    const barcodeTag = generateBarcodeTag(
      input.product_code,
      input.actual_price_per_unit
    );

    // 4. Insert record
    await turso.execute(
      `INSERT INTO order_inventory (
        inventory_id,
        order_id,
        order_transaction_type,
        order_payment_type,
        Type,
        product_code,
        unit_quantity,
        kg_quantity,
        barcode_tag,
        declared_price_per_unit,
        declared_price_per_kg,
        actual_price_per_unit,
        actual_price_per_kg
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newInventoryId,
        input.order_id,
        input.order_transaction_type,
        input.order_payment_type,
        input.type,
        input.product_code,
        input.unit_quantity ?? null,
        input.kg_quantity ?? null,
        barcodeTag,
        input.declared_price_per_unit ?? null,
        input.declared_price_per_kg ?? null,
        input.actual_price_per_unit ?? null,
        input.actual_price_per_kg ?? null,
      ]
    );

    return jsonResponse(
      { message: "Order inventory created successfully" },
      200
    );
  } catch (err: any) {
    console.error("Order Inventory Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
