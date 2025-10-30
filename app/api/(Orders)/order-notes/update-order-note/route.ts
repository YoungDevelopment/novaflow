/**
 * PATCH /api/order-notes/update-order-note
 * Body: { order_note_id: string; note?: string | null }
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { updateOrderNoteSchema, UpdateOrderNoteInput } from "../validators";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = updateOrderNoteSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request body",
          details: parsed.error.flatten(),
        },
        400
      );
    }
    const validated: UpdateOrderNoteInput = parsed.data;

    await turso.execute(
      `UPDATE order_notes SET note = ?, updated_at = CURRENT_TIMESTAMP WHERE order_note_id = ?;`,
      [validated.note ?? null, validated.order_note_id]
    );

    const fetchUpdated = await turso.execute(
      `SELECT order_note_id, order_id, note, created_at, updated_at FROM order_notes WHERE order_note_id = ?;`,
      [validated.order_note_id]
    );
    const updated = fetchUpdated?.rows?.[0];

    if (!updated) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Order note with ID ${validated.order_note_id} not found`,
        },
        404
      );
    }

    return jsonResponse({ data: updated }, 200);
  } catch (err: any) {
    console.error("Update order note error:", err);
    const message = err?.message ?? "Failed to update order note";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}


