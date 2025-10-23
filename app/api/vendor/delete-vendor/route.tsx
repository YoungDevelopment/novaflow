// /app/api/vendor/delete-vendor/route.ts

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { deleteVendorSchema } from "../validators/deleteVendorValidator";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // Validate vendor ID
    const parsed = deleteVendorSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid Vendor_ID",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const { Vendor_ID } = parsed.data;

    // Check if vendor exists
    const existingVendor = await turso.execute(
      `SELECT Vendor_ID FROM vendors WHERE Vendor_ID = ? LIMIT 1`,
      [Vendor_ID]
    );

    if (existingVendor.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: "Vendor not found",
        },
        404
      );
    }

    // Delete vendor
    await turso.execute(`DELETE FROM vendors WHERE Vendor_ID = ?`, [Vendor_ID]);

    return jsonResponse(
      {
        message: "Vendor deleted successfully",
        Vendor_ID,
      },
      200
    );
  } catch (error) {
    console.error("Delete vendor error:", error);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
