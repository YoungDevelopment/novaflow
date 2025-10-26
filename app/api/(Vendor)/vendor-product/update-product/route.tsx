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

    const product_description_check = await turso.execute(
      `SELECT Product_Description FROM vendor_product_code WHERE Product_Description = ? AND Product_Code != ?`,
      [input.Product_Description || "", input.Product_Code || ""]
    );
    if (product_description_check.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Product_Description already exists",
        },
        409
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

    // Fetch and return the updated product
    const updated = await turso.execute(
      `SELECT * FROM vendor_product_code WHERE Product_Code = ? LIMIT 1`,
      [input.Product_Code]
    );

    if (updated.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Product not found after update" },
        404
      );
    }

    const product = updated.rows[0];

    return jsonResponse(
      {
        Product_Code: product.Product_Code,
        Vendor_ID: product.Vendor_ID,
        Material: product.Material,
        Width: product.Width,
        Adhesive_Type: product.Adhesive_Type,
        Paper_GSM: product.Paper_GSM,
        Product_Description: product.Product_Description,
        Created_At: product.Created_At,
        Updated_At: product.Updated_At,
      },
      200
    );
  } catch (err: any) {
    console.error("Update vendor product error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
