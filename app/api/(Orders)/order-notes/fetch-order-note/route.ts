/**
 * GET /api/order-notes/fetch-order-note?order_id=ORD-1
 *
 * Flow:
 *  1. Validate order_id parameter
 *  2. Ensure order exists in orders table
 *  3. Ensure an order_note row exists for this order_id (create if missing)
 *  4. Return the order note data
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import { fetchOrderNoteSchema, FetchOrderNoteInput } from "../validators";

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

    const parsed = fetchOrderNoteSchema.safeParse({ order_id: orderId });
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
    const validated: FetchOrderNoteInput = parsed.data;

    // Ensure order exists
    const orderCheck = await turso.execute(
      `SELECT order_id FROM orders WHERE order_id = ?;`,
      [validated.order_id]
    );
    if (!orderCheck?.rows?.[0]) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Order with ID ${validated.order_id} not found in orders table. Please create the order first.`,
        },
        404
      );
    }

    // Check if order note exists; if not, create a blank one
    const noteCheck = await turso.execute(
      `SELECT order_note_id FROM order_notes WHERE order_id = ?;`,
      [validated.order_id]
    );
    const noteExists = noteCheck?.rows?.[0];

    if (!noteExists) {
      const newOrderNoteId = await generateCustomId({
        tableName: "order_notes",
        idColumnName: "order_note_id",
        prefix: "ONT",
      });

      await turso.execute(
        `INSERT INTO order_notes (order_note_id, order_id, note) VALUES (?, ?, ?);`,
        [newOrderNoteId, validated.order_id, null]
      );
    }

    const fetchResult = await turso.execute(
      `SELECT 
        order_note_id,
        order_id,
        note,
        created_at,
        updated_at
       FROM order_notes
       WHERE order_id = ?;`,
      [validated.order_id]
    );
    const orderNote = fetchResult?.rows?.[0];

    return jsonResponse({ data: nullsToEmpty(orderNote) }, 200);
  } catch (err: any) {
    console.error("Fetch order note by order_id error:", err);
    const message = err?.message ?? "Failed to fetch order note";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}


