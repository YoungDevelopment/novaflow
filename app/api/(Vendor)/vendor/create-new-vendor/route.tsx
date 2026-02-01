/**
 * POST /api/vendor/create-new-vendor
 *
 * Flow:
 *  - Validate payload
 *  - Check uniqueness of Vendor_Name and Vendor_Mask_ID (case-insensitive)
 *  - Generate Vendor_ID as 'VDR-<id>' and update the row
 *  - Insert vendor row (optional fields stored as NULL)
 *  - Vendor_Name_CI and Vendor_Mask_CI are created as case-insensitive duplicates of Vendor_Name and Vendor_Mask_ID
 *  - Return the created vendor object (optional fields returned as "")
 *
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  createVendorSchema,
  CreateVendorInput,
} from "../validators/createVendorValidator";

export async function POST(req: NextRequest) {
  try {
    // ✅ Ensure valid JSON payload
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // ✅ Validate using Zod
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

    // ✅ Manually check for duplicates
    const existing = await turso.execute(
      `SELECT Vendor_ID FROM vendors WHERE Vendor_Name = ? OR Vendor_Mask_ID = ? LIMIT 1`,
      [input.Vendor_Name.trim(), input.Vendor_Mask_ID.trim()]
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

    // ✅ Now generate & update Vendor_ID = VDR-<increment>
    const newVendorId = await generateCustomId({
      tableName: "vendors",
      idColumnName: "Vendor_ID",
      prefix: "VDR",
    });

    // ✅ Insert vendor row (Vendor_ID is NULL for now)
    await turso.execute(
      `INSERT INTO vendors (
          Vendor_ID, Vendor_Name, Vendor_Mask_ID, 
          NTN_Number, STRN_Number, Address_1, Address_2,
          Contact_Number, Contact_Person, Email_ID, Website
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newVendorId,
        input.Vendor_Name.trim(),
        input.Vendor_Mask_ID.trim(),
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

    // ✅ Respond with normalized output
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

    // ✅ If UNIQUE constraint failed → return 409 Conflict
    if (
      err?.message?.includes("UNIQUE constraint failed") ||
      err?.message?.toLowerCase().includes("unique")
    ) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Vendor_Name or Vendor_Mask_ID already exists",
        },
        409
      );
    }

    // ✅ Otherwise → return 500 internal
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
