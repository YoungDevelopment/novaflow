/**
 * GET /api/order-config/fetch-order-config?order_id=ORD-1
 *
 * Flow:
 *  1. Validate order_id parameter
 *  2. Check if order exists in orders table - return 404 if not
 *  3. Check if order_config exists for this order_id
 *  4. If not exists: CREATE a new order_config row with default values
 *  5. Return the order config data
 *
 * Usage:
 * GET /api/order-config/fetch-order-config?order_id=ORD-1
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { fetchOrderConfigSchema, FetchOrderConfigInput } from "../validators";

function nullsToEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = v === null || v === undefined ? "" : v;
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const orderId = url.searchParams.get("order_id");

    // ✅ Validate order_id parameter using Zod
    const parsed = fetchOrderConfigSchema.safeParse({ order_id: orderId });
    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request parameter",
          details: parsed.error.flatten(),
        },
        400
      );
    }
    const validatedData: FetchOrderConfigInput = parsed.data;

    // ✅ STEP 1: Check if order exists in orders table
    const checkOrderSql = `
      SELECT order_id
      FROM orders
      WHERE order_id = ?;
    `;
    const orderCheckResult = await turso.execute(checkOrderSql, [
      validatedData.order_id,
    ]);
    const orderExists = orderCheckResult?.rows?.[0];

    // ✅ STEP 2: If order doesn't exist, throw an error
    if (!orderExists) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Order with ID ${validatedData.order_id} not found in orders table. Please create the order first.`,
        },
        404
      );
    }

    // ✅ STEP 3: Check if order_config exists for this order_id
    const checkConfigSql = `
      SELECT order_config_id
      FROM order_config
      WHERE order_id = ?;
    `;
    const configCheckResult = await turso.execute(checkConfigSql, [
      validatedData.order_id,
    ]);
    const configExists = configCheckResult?.rows?.[0];

    // ✅ STEP 4: If order_config doesn't exist, create it with default values
    if (!configExists) {
      const newOrderConfigId = await generateCustomId({
        tableName: "order_config",
        idColumnName: "order_config_id",
        prefix: "OCG",
      });

      await turso.execute(
        `INSERT INTO order_config (
          order_config_id,
          order_id,
          tax_percentage,
          committed_date,
          entity_order,
          gate_pass
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newOrderConfigId,
          validatedData.order_id,
          0.0, // default tax_percentage
          null, // default committed_date
          null, // default entity_order
          null, // default gate_pass
        ]
      );
    }

    // ✅ STEP 5: Fetch the order_config (either existing or newly created)
    const fetchSql = `
      SELECT 
        order_config_id,
        order_id,
        tax_percentage,
        committed_date,
        entity_order,
        gate_pass,
        created_at,
        updated_at
      FROM order_config
      WHERE order_id = ?;
    `;

    const fetchResult = await turso.execute(fetchSql, [validatedData.order_id]);
    const orderConfig = fetchResult?.rows?.[0];

    // ✅ Clean up null/undefined values
    const cleanedOrderConfig = nullsToEmpty(orderConfig);

    // ✅ Return the order config data
    return jsonResponse(
      {
        data: cleanedOrderConfig,
      },
      200
    );
  } catch (err: any) {
    console.error("Fetch order config by order_id error:", err);
    const message = err?.message ?? "Failed to fetch order config";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}
