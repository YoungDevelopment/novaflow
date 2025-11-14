/**
 * POST /api/order-transactions/create-order-transaction
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Order_ID exists in orders table
 *  - Generate Order_Transcation_ID using id-generator.ts (Prefix: OTR)
 *  - Insert into Order_Transactions table
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createOrderTransactionSchema,
  CreateOrderTransactionInput,
} from "../validators/createOrderTransactionValidator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = createOrderTransactionSchema.safeParse(body);
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

    const input: CreateOrderTransactionInput = parsed.data;

    // 1. Check order exists
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

    // 2. Generate Order_Transcation_ID (Prefix: OTR)
    const newOrderTransactionId = await generateCustomId({
      tableName: "Order_Transactions",
      idColumnName: "Order_Transcation_ID",
      prefix: "OTR",
    });

    // 3. Insert record
    await turso.execute(
      `INSERT INTO Order_Transactions (
        Order_Transcation_ID,
        Order_ID,
        Transaction_Date,
        Type,
        Order_Payment_Type,
        Payment_Method,
        Actual_Amount,
        Decalred_Amount,
        Notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newOrderTransactionId,
        input.Order_ID,
        input.Transaction_Date || null,
        input.Type || null,
        input.Order_Payment_Type || null,
        input.Payment_Method || null,
        input.Actual_Amount,
        input.Decalred_Amount || null,
        input.Notes || null,
      ]
    );

    return jsonResponse(
      { message: "Order transaction created successfully" },
      200
    );
  } catch (err: any) {
    console.error("Order Transaction Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
