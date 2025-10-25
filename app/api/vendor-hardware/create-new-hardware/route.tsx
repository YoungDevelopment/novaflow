/**
 * POST /api/vendor-hardware/create-new-hardware
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Vendor_ID exists
 *  - Check Hardware_Name exists in Hardware_Name_Collection
 *  - Ensure the same Hardware_Name + Hardware_Description for the same Vendor does NOT exist
 *  - Ensure the Hardware_Code_Description does NOT exist anywhere in the table
 *  - Generate Hardware_Code using id-generator.ts (Prefix: HWC)
 *  - Insert into Vendor_Hardware_Code table
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createVendorHardwareSchema,
  CreateVendorHardwareInput,
} from "../validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = createVendorHardwareSchema.safeParse(body);
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

    const input: CreateVendorHardwareInput = parsed.data;

    // 1. Check Vendor exists
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

    // 2. Validate Hardware_Name exists
    const hardwareNameCheck = await turso.execute(
      `SELECT Hardware_Name FROM Hardware_Collection WHERE Hardware_Name = ? LIMIT 1`,
      [input.Hardware_Name]
    );
    if (hardwareNameCheck.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Hardware_Name does not exist" },
        404
      );
    }

    // 3. Ensure the same Hardware_Name + Hardware_Description for the same Vendor does NOT exist
    const existingHardware = await turso.execute(
      `SELECT Hardware_Code FROM Vendor_Hardware_Code
       WHERE Vendor_ID = ? AND Hardware_Name = ? AND Hardware_Description = ? LIMIT 1`,
      [input.Vendor_ID, input.Hardware_Name, input.Hardware_Description]
    );
    if (existingHardware.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message:
            "A hardware with the same Hardware_Name and Hardware_Description already exists for this vendor.",
        },
        409
      );
    }

    // 4. Ensure the Hardware_Code_Description does NOT exist anywhere in the table
    const duplicateDescription = await turso.execute(
      `SELECT Hardware_Code FROM Vendor_Hardware_Code
       WHERE Hardware_Code_Description = ? LIMIT 1`,
      [input.Hardware_Code_Description]
    );
    if (duplicateDescription.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "This Hardware_Code_Description already exists.",
        },
        409
      );
    }

    // 5. Generate Hardware_Code (Prefix HWC)
    const newHardwareCode = await generateCustomId({
      tableName: "Vendor_Hardware_Code",
      idColumnName: "Hardware_Code",
      prefix: "HWC",
    });

    // 6. Insert record
    await turso.execute(
      `INSERT INTO Vendor_Hardware_Code (
        Hardware_Code, Vendor_ID, Hardware_Name, Hardware_Description, Hardware_Code_Description
      ) VALUES (?, ?, ?, ?, ?)`,
      [
        newHardwareCode,
        input.Vendor_ID,
        input.Hardware_Name,
        input.Hardware_Description,
        input.Hardware_Code_Description,
      ]
    );

    return jsonResponse({ message: "Hardware created successfully" }, 200);
  } catch (err: any) {
    console.error("Vendor Hardware Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
