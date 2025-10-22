/**
 * PATCH /api/vendor/update-vendor
 *
 * Purpose:
 *  - Update vendor using Vendor_ID
 *  - Only update provided fields (partial update, not replace all)
 *  - Prevent duplicate Vendor_Name or Vendor_Mask_ID (case-insensitive)
 *  - Auto-update Updated_At timestamp
 *  - Return updated vendor with empty strings ("") instead of NULL
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/response";
import { z } from "zod";

// ✅ PATCH input schema
const updateVendorSchema = z.object({
  Vendor_ID: z.string().trim().min(1, "Vendor_ID is required"),
  Vendor_Name: z.string().trim().optional(),
  Vendor_Mask_ID: z.string().trim().optional(),
  NTN_Number: z.string().optional(),
  STRN_Number: z.string().optional(),
  Address_1: z.string().optional(),
  Address_2: z.string().optional(),
  Contact_Number: z.string().optional(),
  Contact_Person: z.string().optional(),
  Email_ID: z.string().optional(),
  Website: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // ✅ Validate input
    const parsed = updateVendorSchema.safeParse(body);
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

    const {
      Vendor_ID,
      Vendor_Name,
      Vendor_Mask_ID,
      NTN_Number,
      STRN_Number,
      Address_1,
      Address_2,
      Contact_Number,
      Contact_Person,
      Email_ID,
      Website,
    } = parsed.data;

    // ✅ Check if vendor exists
    const existingVendor = await turso.execute(
      `SELECT * FROM vendors WHERE Vendor_ID = ? LIMIT 1`,
      [Vendor_ID]
    );

    if (existingVendor.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Vendor with ID ${Vendor_ID} not found`,
        },
        404
      );
    }

    // ✅ Duplicate Name / Mask detection (case insensitive)
    if (Vendor_Name || Vendor_Mask_ID) {
      const duplicateCheck = await turso.execute(
        `SELECT Vendor_ID FROM vendors 
         WHERE (LOWER(Vendor_Name) = LOWER(?) OR LOWER(Vendor_Mask_ID) = LOWER(?))
         AND Vendor_ID != ? LIMIT 1`,
        [Vendor_Name || "", Vendor_Mask_ID || "", Vendor_ID]
      );

      if (duplicateCheck.rows.length > 0) {
        return errorResponse(
          {
            error: "ConflictError",
            message:
              "Vendor_Name or Vendor_Mask_ID already exists for another vendor",
          },
          409
        );
      }
    }

    // ✅ Build dynamic SQL update
    const fieldsToUpdate: string[] = [];
    const values: any[] = [];

    const updateFields = {
      Vendor_Name,
      Vendor_Mask_ID,
      NTN_Number,
      STRN_Number,
      Address_1,
      Address_2,
      Contact_Number,
      Contact_Person,
      Email_ID,
      Website,
    };

    Object.entries(updateFields).forEach(([key, value]) => {
      if (value !== undefined) {
        fieldsToUpdate.push(`${key} = ?`);
        values.push(value === "" ? null : value); // Save empty as NULL
      }
    });

    if (fieldsToUpdate.length === 0) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "No fields provided to update",
        },
        400
      );
    }

    // ✅ Always update Updated_At timestamp
    fieldsToUpdate.push("Updated_At = CURRENT_TIMESTAMP");

    const sql = `UPDATE vendors SET ${fieldsToUpdate.join(
      ", "
    )} WHERE Vendor_ID = ?`;
    values.push(Vendor_ID);

    await turso.execute(sql, values);

    // ✅ Return updated vendor
    const updated = await turso.execute(
      `SELECT * FROM vendors WHERE Vendor_ID = ? LIMIT 1`,
      [Vendor_ID]
    );
    const vendor = updated.rows[0];

    // Convert NULL → ""
    Object.keys(vendor).forEach((key) => {
      if (vendor[key] === null) vendor[key] = "";
    });

    return jsonResponse(vendor, 200);
  } catch (err: any) {
    console.error("Update vendor error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
