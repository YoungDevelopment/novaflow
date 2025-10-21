/**
 * POST /api/vendor/create-new-vendor
 *
 * Flow:
 *  - Validate payload
 *  - Check uniqueness of Vendor_Name and Vendor_Mask_ID (case-insensitive)
 *  - Insert vendor row (optional fields stored as NULL)
 *  - Generate Vendor_ID as 'VDR-<id>' and update the row
 *  - Return the created vendor object (optional fields returned as "")
 *
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/response";
import {
  createVendorSchema,
  CreateVendorInput,
} from "../validators/createVendorValidator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // Validate payload
    const parsed = createVendorSchema.safeParse(body);
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

    const input: CreateVendorInput = parsed.data;

    // Convert uniqueness fields to case-insensitive for duplicate check
    const vendorNameCI = input.Vendor_Name.trim().toLowerCase();
    const vendorMaskCI = input.Vendor_Mask_ID.trim().toLowerCase();

    // Check duplicate vendor
    const existing = await turso.execute(
      `SELECT id FROM vendors WHERE vendor_name_ci = ? OR vendor_mask_ci = ? LIMIT 1`,
      [vendorNameCI, vendorMaskCI]
    );
    if (existing.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Vendor_Name or Vendor_Mask_ID already exists",
        },
        409
      );
    }

    // Insert data with Vendor_ID=NULL first
    await turso.execute(
      `INSERT INTO vendors (
        Vendor_ID, Vendor_Name, Vendor_Mask_ID, vendor_name_ci, vendor_mask_ci,
        NTN_Number, STRN_Number, Address_1, Address_2,
        Contact_Number, Contact_Person, Email_ID, Website
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        null,
        input.Vendor_Name.trim(),
        input.Vendor_Mask_ID.trim(),
        vendorNameCI,
        vendorMaskCI,
        input.NTN_Number ?? null,
        input.STRN_Number ?? null,
        input.Address_1 ?? null,
        input.Address_2 ?? null,
        input.Contact_Number ?? null,
        input.Contact_Person ?? null,
        input.Email_ID ?? null,
        input.Website ?? null,
      ]
    );

    // Generate & Update Vendor ID
    const newVendorId = await generateCustomId({
      tableName: "vendors",
      idColumnName: "Vendor_ID",
      prefix: "VDR",
    });

    // Return success response
    return jsonResponse(
      {
        Vendor_ID: newVendorId,
        ...input,
        NTN_Number: input.NTN_Number ?? "",
        STRN_Number: input.STRN_Number ?? "",
        Address_1: input.Address_1 ?? "",
        Address_2: input.Address_2 ?? "",
        Contact_Number: input.Contact_Number ?? "",
        Contact_Person: input.Contact_Person ?? "",
        Email_ID: input.Email_ID ?? "",
        Website: input.Website ?? "",
      },
      201
    );
  } catch (err: any) {
    console.error("Create vendor error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
