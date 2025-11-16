/**
 * POST /api/order-header/create-order-header
 *
 * Flow:
 *  - Validate payload
 *  - Generate order_id as 'ORD-<id>'
 *  - Insert order header row
 *  - Return the created order header object
 *
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  createOrderHeaderSchema,
  CreateOrderHeaderInput,
} from "../validators/createOrderHeaderValidator";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

export async function POST(req: NextRequest) {
  try {
    // ✅ Ensure valid JSON payload
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // ✅ Validate using Zod
    const parsed = createOrderHeaderSchema.safeParse(body);
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
    const input: CreateOrderHeaderInput = parsed.data;

    // ✅ Generate order_id = ORD-<increment>
    const newOrderId = await generateCustomId({
      tableName: "orders",
      idColumnName: "order_id",
      prefix: "ORD",
    });

    // ✅ Insert order header row
    await turso.execute(
      `INSERT INTO orders (
          order_id, user, type, company, status, total_due, entity_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderId,
        input.user.trim(),
        input.type.trim(),
        input.company?.trim() || null,
        input.status.trim(),
        input.total_due ?? 0,
        input.entity_id.trim(),
      ]
    );

    // Best-effort recalc immediately after creation
    try {
      await recalculateOrderTotalDue(newOrderId);
    } catch (e) {
      console.warn("Recalc after order create failed:", e);
    }

    // ✅ Respond with the created order
    return jsonResponse(
      {
        order_id: newOrderId,
        user: input.user.trim(),
        type: input.type.trim(),
        company: input.company?.trim() || "",
        status: input.status.trim(),
        total_due: input.total_due ?? 0,
        entity_id: input.entity_id.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      201
    );
  } catch (err: any) {
    console.error("Create order header error:", err);

    // ✅ If UNIQUE constraint failed → return 409 Conflict
    if (
      err?.message?.includes("UNIQUE constraint failed") ||
      err?.message?.toLowerCase().includes("unique")
    ) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Order ID already exists",
        },
        409
      );
    }

    // ✅ Otherwise → return 500 internal
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
