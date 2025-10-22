/**
 * DELETE Vendor by ID
 *
 * Endpoint: DELETE /api/vendor/delete-vendor
 * Description: Deletes a vendor record from the database by Vendor_ID
 *
 * Request Body:
 * {
 *   "Vendor_ID": "VDR-1"
 * }
 *
 * Success Response (200):
 * {
 *   "message": "Vendor deleted successfully",
 *   "Vendor_ID": "VDR-1"
 * }
 *
 * Error Responses:
 * - 400: Validation error (missing or invalid Vendor_ID)
 * - 404: Vendor not found
 * - 500: Server error
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/response";

export async function DELETE(req: NextRequest) {
  try {
    // Step 1: Parse request body
    const body = await req.json().catch(() => null);

    if (!body) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Request body must be JSON",
        },
        400
      );
    }

    // Step 2: Validate Vendor_ID
    const { Vendor_ID } = body;

    if (!Vendor_ID) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Vendor_ID is required",
        },
        400
      );
    }

    // Validate Vendor_ID format (VDR-1, VDR-123, etc.)
    const vendorIdPattern = /^VDR-\d+$/;
    if (!vendorIdPattern.test(Vendor_ID)) {
      return errorResponse(
        {
          error: "ValidationError",
          message:
            "Vendor_ID must be in format VDR-{number} (e.g., VDR-1, VDR-123)",
        },
        400
      );
    }

    // Step 3: Check if vendor exists before deleting
    const existingVendor = await turso.execute(
      `SELECT Vendor_ID FROM vendors WHERE Vendor_ID = ? LIMIT 1`,
      [Vendor_ID]
    );

    if (existingVendor.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Vendor with ID '${Vendor_ID}' not found`,
        },
        404
      );
    }

    // Step 4: Delete the vendor
    await turso.execute(`DELETE FROM vendors WHERE Vendor_ID = ?`, [Vendor_ID]);

    // Step 5: Return success response
    return jsonResponse(
      {
        message: "Vendor deleted successfully",
        Vendor_ID: Vendor_ID,
      },
      200
    );
  } catch (err: any) {
    console.error("Delete vendor error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
