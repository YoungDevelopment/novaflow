/**
 * PATCH /api/vendor-product/update-product
 *
 * Updates an existing vendor product.
 * Validates input, checks product existence,
 * we will not validate Material & Adhesive_Type as they are not in the payload.
 * Automatically updates Updated_At timestamp.
 * returns success message.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import { updateVendorProductSchema } from "../validators/updateVendorProductValidator";
import { UpdateVendorProductInput } from "../validators";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = updateVendorProductSchema.safeParse(body);
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

    const input: UpdateVendorProductInput = parsed.data;

    // 1. Check if the product exists
    const productCheck = await turso.execute(
      `SELECT Product_Code FROM vendor_product_code WHERE Product_Code = ?`,
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

    // Prepare dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(input).forEach(([key, val]) => {
      if (key !== "Product_Code" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });

    // If no fields provided to update, return error
    if (fields.length === 0) {
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );
    }

    // Add timestamp
    fields.push("Updated_At = CURRENT_TIMESTAMP");

    // Add WHERE clause value
    values.push(input.Product_Code);

    await turso.execute(
      `UPDATE vendor_product_code SET ${fields.join(
        ", "
      )} WHERE Product_Code = ?`,
      [...values]
    );
  } catch (err: any) {
    console.error("Update vendor product error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }

  // Return success message
  return jsonResponse(
    {
      message: "Vendor Product updated successfully",
    },
    200
  );
}
