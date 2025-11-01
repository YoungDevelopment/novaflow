/**
 * POST /api/order-items/create-order-item
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check order_id exists in orders table
 *  - Generate order_item_id using id-generator.ts (Prefix: OIT)
 *  - Insert into Order_Items table
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createOrderItemSchema,
  CreateOrderItemInput,
} from "../validators/createOrderItemValidator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = createOrderItemSchema.safeParse(body);
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

    const input: CreateOrderItemInput = parsed.data;

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

    // 2. Generate order_item_id (Prefix: OIT)
    const newOrderItemId = await generateCustomId({
      tableName: "Order_Items",
      idColumnName: "order_item_id",
      prefix: "OIT",
    });

    // 3. Insert record with defaults
    await turso.execute(
      `INSERT INTO Order_Items (
        order_item_id,
        order_id,
        movement,
        product_code,
        item_type,
        description,
        hs_code,
        unit,
        kg,
        declared_price_per_unit,
        declared_price_per_kg,
        actual_price_per_unit,
        actual_price_per_kg,
        declared_amount,
        actual_amount
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderItemId,
        input.order_id,
        input.movement ?? "N",
        input.product_code,
        input.item_type ?? null,
        input.description ?? null,
        input.hs_code ?? null,
        input.unit ?? null,
        input.kg ?? 0.0,
        input.declared_price_per_unit ?? 0.0,
        input.declared_price_per_kg ?? 0.0,
        input.actual_price_per_unit ?? 0.0,
        input.actual_price_per_kg ?? 0.0,
        input.declared_amount ?? 0.0,
        input.actual_amount ?? 0.0,
      ]
    );

    return jsonResponse({ message: "Order item created successfully" }, 200);
  } catch (err: any) {
    console.error("Order Item Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
