/**
 * PUT Update Vendor
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/response";

export async function PUT(req: NextRequest) {
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

    // Step 2: Validate Vendor_ID (required)
    const { Vendor_ID, ...updateFields } = body;

    if (!Vendor_ID) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Vendor_ID is required",
        },
        400
      );
    }

    // Validate Vendor_ID format
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

    // Step 3: Check if vendor exists
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

    // Step 4: Define allowed fields and filter
    const allowedFields = [
      "Vendor_Name",
      "Vendor_Mask_ID",
      "NTN_Number",
      "STRN_Number",
      "Address_1",
      "Address_2",
      "Contact_Number",
      "Contact_Person",
      "Email_ID",
      "Website",
    ];

    const fieldsToUpdate: { [key: string]: any } = {};
    const updatedFieldNames: string[] = [];

    for (const field of allowedFields) {
      if (updateFields.hasOwnProperty(field)) {
        fieldsToUpdate[field] = updateFields[field];
        updatedFieldNames.push(field);
      }
    }

    // Step 5: Check if there are any fields to update
    if (Object.keys(fieldsToUpdate).length === 0) {
      return errorResponse(
        {
          error: "ValidationError",
          message:
            "No valid fields to update. Provide at least one field to update.",
        },
        400
      );
    }

    // Step 6: Check for uniqueness constraints
    if (fieldsToUpdate.Vendor_Name || fieldsToUpdate.Vendor_Mask_ID) {
      const uniqueChecks: string[] = [];
      const uniqueParams: any[] = [];

      if (fieldsToUpdate.Vendor_Name) {
        uniqueChecks.push("LOWER(Vendor_Name) = LOWER(?)");
        uniqueParams.push(fieldsToUpdate.Vendor_Name.trim());
      }

      if (fieldsToUpdate.Vendor_Mask_ID) {
        uniqueChecks.push("LOWER(Vendor_Mask_ID) = LOWER(?)");
        uniqueParams.push(fieldsToUpdate.Vendor_Mask_ID.trim());
      }

      if (uniqueChecks.length > 0) {
        uniqueParams.push(Vendor_ID);

        const duplicateCheck = await turso.execute(
          `SELECT Vendor_ID FROM vendors 
           WHERE (${uniqueChecks.join(" OR ")}) 
           AND Vendor_ID != ? 
           LIMIT 1`,
          uniqueParams
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
    }

    // Step 7: Build dynamic UPDATE query
    const setClauses: string[] = [];
    const params: any[] = [];

    for (const [field, value] of Object.entries(fieldsToUpdate)) {
      setClauses.push(`${field} = ?`);

      if (value === "" || value === null || value === undefined) {
        params.push(null);
      } else {
        params.push(typeof value === "string" ? value.trim() : value);
      }
    }

    // ✅ Always update the updated_at timestamp
    setClauses.push("updated_at = CURRENT_TIMESTAMP");

    params.push(Vendor_ID);

    // Step 8: Execute UPDATE query
    const updateQuery = `
      UPDATE vendors 
      SET ${setClauses.join(", ")}
      WHERE Vendor_ID = ?
    `;

    await turso.execute(updateQuery, params);

    // Step 9: Fetch updated vendor to get new timestamp
    const updatedVendor = await turso.execute(
      `SELECT updated_at FROM vendors WHERE Vendor_ID = ? LIMIT 1`,
      [Vendor_ID]
    );

    const newTimestamp = updatedVendor.rows[0].updated_at as string;

    // Step 10: Return success response with timestamp
    return jsonResponse(
      {
        message: "Vendor updated successfully",
        Vendor_ID,
        updatedFields: updatedFieldNames,
        updated_at: newTimestamp,
      },
      200
    );
  } catch (err: any) {
    console.error("Update vendor error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
        details: err.message,
      },
      500
    );
  }
}
