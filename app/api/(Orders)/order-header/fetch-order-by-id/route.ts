/**
 * GET /api/order-header/fetch-order-by-id?order_id=ORD-1
 *
 * Fetches order details by order_id.
 * Returns all fields for the specified order.
 * Returns 404 if order not found.
 *
 * Usage:
 * GET /api/order-header/fetch-order-by-id?order_id=ORD-1
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  fetchOrderHeaderSchema,
  FetchOrderHeaderInput,
} from "../validators/fetchOrderHeaderValidator";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

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
    const parsed = fetchOrderHeaderSchema.safeParse({ order_id: orderId });
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
    const validatedData: FetchOrderHeaderInput = parsed.data;

    // ✅ Recalculate total_due and status before fetching
    // This ensures the order status is always up-to-date when viewing the invoice
    try {
      await recalculateOrderTotalDue(validatedData.order_id);
    } catch (recalcErr) {
      // Log but don't fail the request - order might not exist yet
      console.warn("Recalculate on fetch skipped:", recalcErr);
    }

    // ✅ Fetch order by ID
    const sql = `
      SELECT 
        order_id,
        user,
        type,
        company,
        status,
        total_due,
        entity_id,
        created_at,
        updated_at
      FROM orders
      WHERE order_id = ?;
    `;

    const result = await turso.execute(sql, [validatedData.order_id]);
    const rows = result?.rows ?? [];

    // ✅ Check if order exists
    if (rows.length === 0) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Order with ID ${validatedData.order_id} not found`,
        },
        404
      );
    }

    // ✅ Clean up null/undefined values
    const order = nullsToEmpty(rows[0]);

    // ✅ Return the order data
    return jsonResponse(
      {
        data: order,
      },
      200
    );
  } catch (err: any) {
    console.error("Fetch order by ID error:", err);
    const message = err?.message ?? "Failed to fetch order";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}
