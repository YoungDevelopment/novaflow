/**
 * DELETE /api/order-transactions/delete-order-transaction
 *
 * Deletes an order transaction record from the Order_Transactions table.
 * - Validates input with Zod.
 * - Checks if Order_Transcation_ID exists before deleting.
 * - Returns proper errors or success response.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  deleteOrderTransactionSchema,
  DeleteOrderTransactionInput,
} from "../validators/deleteOrderTransactionValidator";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // ✅ Zod validation
    const parsed = deleteOrderTransactionSchema.safeParse(body);
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

    const input: DeleteOrderTransactionInput = parsed.data;

    // ✅ Check if order transaction exists
    const transactionCheck = await turso.execute(
      `SELECT Order_Transcation_ID FROM Order_Transactions WHERE Order_Transcation_ID = ?`,
      [input.Order_Transcation_ID]
    );

    if (!transactionCheck?.rows?.length) {
      return errorResponse(
        {
          error: "NotFound",
          message: `Order_Transcation_ID ${input.Order_Transcation_ID} not found`,
        },
        404
      );
    }

    // ✅ Delete order transaction
    await turso.execute(
      `DELETE FROM Order_Transactions WHERE Order_Transcation_ID = ?`,
      [input.Order_Transcation_ID]
    );

    return jsonResponse(
      { message: "Order transaction deleted successfully" },
      200
    );
  } catch (error: any) {
    console.error("Delete order transaction error:", error);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
