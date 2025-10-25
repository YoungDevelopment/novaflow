/**
 * POST /api/vendor-product/create-new-product
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Vendor_ID exists
 *  - Check Material exists in Material_Collection
 *  - Check Adhesive_Type exists in Adhesive_Collection
 *  - Prevent duplicate Product_Description for same Vendor_ID
 *  - Generate Product_Code using id-generator.ts (Prefix: VPC)
 *  - Insert into Vendor_Product_Code table
 *  - Return inserted data (blank NULL → "")
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createVendorProductSchema,
  CreateVendorProductInput,
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

    const parsed = createVendorProductSchema.safeParse(body);
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

    const input: CreateVendorProductInput = parsed.data;

    // 1. Check if Vendor exists
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

    // 2. Validate Material exists
    const materialCheck = await turso.execute(
      `SELECT Material_Name FROM Material_Collection WHERE Material_Name = ? LIMIT 1`,
      [input.Material]
    );
    if (materialCheck.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFound",
          message: "Material not found in Material_Collection",
        },
        404
      );
    }

    // 3. Validate Adhesive_Type exists
    const adhesiveCheck = await turso.execute(
      `SELECT Adhesive_Name FROM Adhesive_Collection WHERE Adhesive_Name = ? LIMIT 1`,
      [input.Adhesive_Type]
    );
    if (adhesiveCheck.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFound",
          message: "Adhesive_Type not found in Adhesive_Collection",
        },
        404
      );
    }

    // 4. Check Duplicate (Vendor + Product_Description)
    const duplicateCheck = await turso.execute(
      `SELECT Product_Code FROM Vendor_Product_Code WHERE Vendor_ID = ? AND Product_Description = ? LIMIT 1`,
      [input.Vendor_ID, input.Product_Description]
    );
    if (duplicateCheck.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "This Product_Description already exists for this Vendor",
        },
        409
      );
    }

    // 5. Generate Product_Code (Prefix VPC)
    const newProductCode = await generateCustomId({
      tableName: "Vendor_Product_Code",
      idColumnName: "Product_Code",
      prefix: "VPC",
    });

    // 6. Insert record
    await turso.execute(
      `INSERT INTO Vendor_Product_Code (
        Product_Code, Vendor_ID, Material, Width, Adhesive_Type, Paper_GSM, Product_Description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newProductCode,
        input.Vendor_ID,
        input.Material,
        input.Width,
        input.Adhesive_Type,
        input.Paper_GSM,
        input.Product_Description,
      ]
    );

    return jsonResponse(
      {
        message: "Product created successfully",
        data: {
          Product_Code: newProductCode,
          Vendor_ID: input.Vendor_ID,
          Material: input.Material,
          Width: input.Width,
          Adhesive_Type: input.Adhesive_Type,
          Paper_GSM: input.Paper_GSM,
          Product_Description: input.Product_Description,
        },
      },
      201
    );
  } catch (err: any) {
    console.error("Vendor Product Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
