/**
 * POST /api/order-inventory/sync-to-inventory
 *
 * Flow:
 *  - Validate input with Zod (order_id)
 *  - Check order_id exists in orders table
 *  - Fetch all order items where movement = 'Y' (received items)
 *  - For each item, upsert into order_inventory table:
 *    - Match by order_id + product_code + actual_price_per_unit (barcode_tag)
 *    - If exists: update quantities and prices
 *    - If not exists: create new inventory record
 *  - Uses default values:
 *    - order_transaction_type: "Purchase"
 *    - order_payment_type: "Credit"
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  syncToInventorySchema,
  SyncToInventoryInput,
} from "../validators/syncToInventoryValidator";

// Default values for inventory records
const DEFAULT_TRANSACTION_TYPE = "Purchase";
const DEFAULT_PAYMENT_TYPE = "Credit";

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

    const parsed = syncToInventorySchema.safeParse(body);
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

    const input: SyncToInventoryInput = parsed.data;

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

    // 2. Fetch all order items where movement = 'Y' (received items)
    const orderItemsResult = await turso.execute(
      `SELECT 
        order_item_id,
        order_id,
        product_code,
        item_type,
        description,
        unit,
        kg,
        declared_price_per_unit,
        declared_price_per_kg,
        actual_price_per_unit,
        actual_price_per_kg
      FROM order_items 
      WHERE order_id = ? AND movement = 'Y'`,
      [input.order_id]
    );

    const orderItems = orderItemsResult.rows;

    if (orderItems.length === 0) {
      return jsonResponse(
        {
          message: "No received items found to sync",
          synced_count: 0,
          created_count: 0,
          updated_count: 0,
        },
        200
      );
    }

    let createdCount = 0;
    let updatedCount = 0;

    // 3. Process each order item
    for (const item of orderItems) {
      const productCode = item.product_code as string;
      const actualPricePerUnit = item.actual_price_per_unit as number | null;
      const barcodeTag = generateBarcodeTag(productCode, actualPricePerUnit);

      // Check if inventory record exists (match by order_id + barcode_tag)
      const existingInventory = await turso.execute(
        `SELECT inventory_id, unit_quantity, kg_quantity 
         FROM order_inventory 
         WHERE order_id = ? AND barcode_tag = ? 
         LIMIT 1`,
        [input.order_id, barcodeTag]
      );

      if (existingInventory.rows.length > 0) {
        // Update existing record
        const existingRecord = existingInventory.rows[0];
        const inventoryId = existingRecord.inventory_id as string;

        await turso.execute(
          `UPDATE order_inventory SET
            unit_quantity = ?,
            kg_quantity = ?,
            declared_price_per_unit = ?,
            declared_price_per_kg = ?,
            actual_price_per_unit = ?,
            actual_price_per_kg = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE inventory_id = ?`,
          [
            item.unit ?? null,
            item.kg ?? null,
            item.declared_price_per_unit ?? null,
            item.declared_price_per_kg ?? null,
            item.actual_price_per_unit ?? null,
            item.actual_price_per_kg ?? null,
            inventoryId,
          ]
        );

        updatedCount++;
      } else {
        // Create new inventory record
        const newInventoryId = await generateCustomId({
          tableName: "order_inventory",
          idColumnName: "inventory_id",
          prefix: "INV",
        });

        // Map item_type to Type (product -> product, Hardware -> hardware)
        const inventoryType = (item.item_type as string)?.toLowerCase() || "product";

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
            DEFAULT_TRANSACTION_TYPE,
            DEFAULT_PAYMENT_TYPE,
            inventoryType,
            productCode,
            item.unit ?? null,
            item.kg ?? null,
            barcodeTag,
            item.declared_price_per_unit ?? null,
            item.declared_price_per_kg ?? null,
            item.actual_price_per_unit ?? null,
            item.actual_price_per_kg ?? null,
          ]
        );

        createdCount++;
      }
    }

    return jsonResponse(
      {
        message: "Inventory sync completed successfully",
        synced_count: createdCount + updatedCount,
        created_count: createdCount,
        updated_count: updatedCount,
      },
      200
    );
  } catch (err: any) {
    console.error("Sync to Inventory Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
