/**
 * PATCH /api/vendor-hardware/update-hardware
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Hardware_Code exists
 *  - If Vendor_ID is passed → ensure vendor exists
 *  - If Hardware_Name is passed → ensure exists in Hardware_Collection
 *  - If Hardware_Name + Hardware_Description + Vendor_ID are passed → check duplicate
 *  - If Hardware_Code_Description is passed → ensure globally unique
 *  - Perform dynamic update & update Updated_At
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  updateVendorHardwareSchema,
  UpdateVendorHardwareInput,
} from "../validators";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = updateVendorHardwareSchema.safeParse(body);
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

    const input: UpdateVendorHardwareInput = parsed.data;

    // 1. Ensure record exists
    const existing = await turso.execute(
      `SELECT * FROM Vendor_Hardware_Code WHERE Hardware_Code = ? LIMIT 1`,
      [input.Hardware_Code]
    );
    if (existing.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Hardware_Code does not exist" },
        404
      );
    }

    // Use old data if fields are not provided (for duplicate checks)
    const oldData = existing.rows[0];

    const newVendorId = input.Vendor_ID ?? oldData.Vendor_ID;
    const newHardwareName = input.Hardware_Name ?? oldData.Hardware_Name;
    const newDescription =
      input.Hardware_Description ?? oldData.Hardware_Description;

    // 2. If Vendor_ID is provided → validate
    if (input.Vendor_ID) {
      const vendorCheck = await turso.execute(
        `SELECT Vendor_ID FROM vendors WHERE Vendor_ID = ? LIMIT 1`,
        [input.Vendor_ID]
      );
      if (vendorCheck.rows.length === 0) {
        return errorResponse(
          { error: "NotFound", message: "Vendor_ID does not exist" },
          404
        );
      }
    }

    // 3. If Hardware_Name is provided → check in Hardware_Collection
    if (input.Hardware_Name) {
      const hardwareCheck = await turso.execute(
        `SELECT Hardware_Name FROM Hardware_Collection WHERE Hardware_Name = ? LIMIT 1`,
        [input.Hardware_Name]
      );
      if (hardwareCheck.rows.length === 0) {
        return errorResponse(
          { error: "NotFound", message: "Hardware_Name not found" },
          404
        );
      }
    }

    // 4. Prevent duplicate: Vendor_ID + Hardware_Name + Hardware_Description
    const duplicateCheck = await turso.execute(
      `SELECT Hardware_Code
       FROM Vendor_Hardware_Code
       WHERE Vendor_ID = ? AND Hardware_Name = ? AND Hardware_Description = ?
         AND Hardware_Code != ?
       LIMIT 1`,
      [newVendorId, newHardwareName, newDescription, input.Hardware_Code]
    );
    if (duplicateCheck.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message:
            "Duplicate found: This combination of Vendor_ID, Hardware_Name, and Hardware_Description already exists.",
        },
        409
      );
    }

    // 5. Ensure Hardware_Code_Description is globally unique if provided
    if (input.Hardware_Code_Description) {
      const descriptionCheck = await turso.execute(
        `SELECT Hardware_Code FROM Vendor_Hardware_Code
         WHERE Hardware_Code_Description = ? AND Hardware_Code != ?
         LIMIT 1`,
        [input.Hardware_Code_Description, input.Hardware_Code]
      );
      if (descriptionCheck.rows.length > 0) {
        return errorResponse(
          {
            error: "ConflictError",
            message: "This Hardware_Code_Description already exists.",
          },
          409
        );
      }
    }

    // 6. Dynamic SQL update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(input).forEach(([key, val]) => {
      if (key !== "Hardware_Code" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val);
      }
    });

    if (fields.length === 0) {
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );
    }

    fields.push("Updated_At = CURRENT_TIMESTAMP");
    values.push(input.Hardware_Code);

    await turso.execute(
      `UPDATE Vendor_Hardware_Code SET ${fields.join(
        ", "
      )} WHERE Hardware_Code = ?`,
      values
    );

    return jsonResponse({ message: "Hardware updated successfully" }, 200);
  } catch (err: any) {
    console.error("Vendor Hardware Update Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
