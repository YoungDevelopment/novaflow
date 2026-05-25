/**
 * DELETE /api/customer-product/delete-product
 *
 * Deletes a product from the customer_product_code table.
 * Validates input using Zod validator file.
 * Checks if product exists before deletion.
 * Returns success message on successful deletion.
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import { deleteCustomerProductSchema } from "../validators";
import { DeleteCustomerProductInput } from "../validators";
export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = deleteCustomerProductSchema.safeParse(body);
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

    const input: DeleteCustomerProductInput = parsed.data;

    // ✅ Check if product exists
    const productCheck = await turso.execute(
      `SELECT Product_Code FROM customer_product_code WHERE Product_Code = ?`,
      [input.Product_Code]
    );

    if (!productCheck?.rows?.length) {
      return errorResponse(
        {
          error: "NotFound",
          message: `Product_Code ${input.Product_Code} not found`,
        },
        404
      );
    }

    // ✅ Delete product
    await turso.execute(
      `DELETE FROM customer_product_code WHERE Product_Code = ?`,
      [input.Product_Code]
    );

    return jsonResponse(
      { message: "Customer Product deleted successfully" },
      200
    );
  } catch (error: any) {
    console.error("Delete customer product error:", error);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
