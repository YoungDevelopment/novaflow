/**
 * DELETE /api/vendor-hardware/delete-hardware
 *
 * Deletes a hardware record from the Vendor_Hardware_code table.
 * - Validates input with Zod.
 * - Checks if Hardware_Code exists before deleting.
 * - Returns proper errors or success response.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  deleteHardwareSchema,
  DeleteHardwareInput,
} from "../validators/deleteVendorHardwareValidator";
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
    const parsed = deleteHardwareSchema.safeParse(body);
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

    const input: DeleteHardwareInput = parsed.data;

    // ✅ Check if hardware exists
    const hardwareCheck = await turso.execute(
      `SELECT Hardware_Code FROM Vendor_Hardware_code WHERE Hardware_Code = ?`,
      [input.Hardware_Code]
    );

    if (!hardwareCheck?.rows?.length) {
      return errorResponse(
        {
          error: "NotFound",
          message: `Hardware_Code ${input.Hardware_Code} not found`,
        },
        404
      );
    }

    // ✅ Delete hardware
    await turso.execute(
      `DELETE FROM Vendor_Hardware_code WHERE Hardware_Code = ?`,
      [input.Hardware_Code]
    );

    return jsonResponse({ message: "Hardware deleted successfully" }, 200);
  } catch (error: any) {
    console.error("Delete hardware error:", error);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
