/**
 * POST /api/order-charges/create-order-charge
 *
 * - Validate body with Zod (all fields mandatory except ID which is generated)
 * - Ensure Order_ID exists in orders table
 * - Generate Order_Charges_ID (Prefix: OCH)
 * - Insert into Order_Charges
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createOrderChargeSchema,
  CreateOrderChargeInput,
} from "../validators/createOrderChargeValidator";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = createOrderChargeSchema.safeParse(body);
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

    const input: CreateOrderChargeInput = parsed.data;

    // Ensure Order exists
    const orderCheck = await turso.execute(
      `SELECT order_id FROM orders WHERE order_id = ? LIMIT 1`,
      [input.Order_ID]
    );
    if (orderCheck.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Order_ID does not exist" },
        404
      );
    }

    // Generate ID
    const newId = await generateCustomId({
      tableName: "Order_Charges",
      idColumnName: "Order_Charges_ID",
      prefix: "OCH",
    });

    // Insert record
    await turso.execute({
      sql: `INSERT INTO Order_Charges (Order_Charges_ID, Order_ID, Description, Charges)
            VALUES (?, ?, ?, ?)`,
      args: [newId, input.Order_ID, input.Description, input.Charges],
    });

    // Best-effort recalc
    try {
      await recalculateOrderTotalDue(input.Order_ID);
    } catch (e) {
      console.warn("Recalc after charge create failed:", e);
    }

    return jsonResponse(
      { message: "Order charge created successfully", Order_Charges_ID: newId },
      201
    );
  } catch (error: any) {
    console.error("Create order charge error:", error);
    return errorResponse(
      {
        error: "ServerError",
        message: "Failed to create order charge",
        details: error?.message,
      },
      500
    );
  }
}
