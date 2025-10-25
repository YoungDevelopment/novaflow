/**
 * PATCH /api/vendor/update
 *
 * Updates only the fields provided in payload.
 * Validates input using Zod validator file.
 * Checks for duplicate Vendor_Name or Vendor_Mask_ID (case-insensitive).
 * Saves empty strings as NULL, but returns them as "".
 * Automatically updates Updated_At timestamp.
 * returns success message.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import { updateVendorSchema, UpdateVendorInput } from "../validators";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );

    // ✅ Validate payload using Zod schema
    const parsed = updateVendorSchema.safeParse(body);
    if (!parsed.success)
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        400
      );

    const data: UpdateVendorInput = parsed.data;

    // ✅ Check if vendor exists
    const exist = await turso.execute(
      "SELECT * FROM vendors WHERE Vendor_ID = ? LIMIT 1",
      [data.Vendor_ID]
    );
    if (exist.rows.length === 0)
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Vendor with ID ${data.Vendor_ID} not found`,
        },
        404
      );

    // ✅ Check duplicates (if name or mask is being updated)
    if (data.Vendor_Name || data.Vendor_Mask_ID) {
      const duplicate = await turso.execute(
        `SELECT Vendor_ID FROM vendors
         WHERE (LOWER(Vendor_Name) = LOWER(?) OR LOWER(Vendor_Mask_ID) = LOWER(?))
         AND Vendor_ID != ? LIMIT 1`,
        [data.Vendor_Name || "", data.Vendor_Mask_ID || "", data.Vendor_ID]
      );
      if (duplicate.rows.length > 0)
        return errorResponse(
          {
            error: "ConflictError",
            message: "Vendor_Name or Vendor_Mask_ID already exists",
          },
          409
        );
    }

    // ✅ Prepare dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, val]) => {
      if (key !== "Vendor_ID" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val === "" ? null : val);
      }
    });

    if (fields.length === 0)
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );

    // ✅ Add timestamp update
    fields.push("Updated_At = CURRENT_TIMESTAMP");
    values.push(data.Vendor_ID);

    try {
      await turso.execute(
        `UPDATE vendors SET ${fields.join(", ")} WHERE Vendor_ID = ?`,
        values
      );
    } catch (updateErr: any) {
      console.error("Vendor update DB error:", updateErr);
      return errorResponse(
        {
          error: "UpdateError",
          message: "Failed to update vendor. Please try again later.",
        },
        500
      );
    }

    // Return success message
    return jsonResponse(
      {
        message: "Vendor updated successfully",
      },
      200
    );
  } catch (err: any) {
    console.error("Update vendor error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
