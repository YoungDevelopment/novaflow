/**
 * POST /api/customer-product/create-new-product
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Customer_ID exists
 *  - Check Material exists in Material_Collection
 *  - Check Adhesive_Type exists in Adhesive_Collection
 *  - Prevent duplicate Product_Description for same Customer_ID
 *  - Generate Product_Code using id-generator.ts (Prefix: CPC)
 *  - Insert into Customer_Product_Code table
 *  - Return inserted data (blank NULL → "")
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createCustomerProductSchema,
  CreateCustomerProductInput,
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

    const parsed = createCustomerProductSchema.safeParse(body);
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

    const input: CreateCustomerProductInput = parsed.data;

    // 1. Check if Customer exists
    const customerCheck = await turso.execute(
      `SELECT Customer_ID FROM customers WHERE Customer_ID = ? LIMIT 1`,
      [input.Customer_ID]
    );
    if (customerCheck.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Customer_ID does not exist" },
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

    // 4. Check Duplicate (Customer + Product_Description)
    const duplicateCheck = await turso.execute(
      `SELECT Product_Code FROM Customer_Product_Code WHERE Customer_ID = ? AND Product_Description = ? LIMIT 1`,
      [input.Customer_ID, input.Product_Description]
    );
    if (duplicateCheck.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "This Product_Description already exists for this Customer",
        },
        409
      );
    }

    // 5. Generate Product_Code (Prefix CPC)
    const newProductCode = await generateCustomId({
      tableName: "Customer_Product_Code",
      idColumnName: "Product_Code",
      prefix: "CPC",
    });

    // 6. Insert record
    await turso.execute(
      `INSERT INTO Customer_Product_Code (
        Product_Code, Customer_ID, Material, Width, Adhesive_Type, Paper_GSM, Product_Description, HS_Code, Customer_Description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newProductCode,
        input.Customer_ID,
        input.Material,
        input.Width,
        input.Adhesive_Type,
        input.Paper_GSM,
        input.Product_Description,
        input.HS_Code ?? null,
        input.Customer_Description ?? null,
      ]
    );

    // 7. Fetch and return the created product
    const created = await turso.execute(
      `SELECT * FROM Customer_Product_Code WHERE Product_Code = ? LIMIT 1`,
      [newProductCode]
    );

    if (created.rows.length === 0) {
      return errorResponse(
        { error: "NotFound", message: "Product not found after creation" },
        404
      );
    }

    const product = created.rows[0];

    return jsonResponse(
      {
        Product_Code: product.Product_Code,
        Customer_ID: product.Customer_ID,
        Material: product.Material,
        Width: product.Width,
        Adhesive_Type: product.Adhesive_Type,
        Paper_GSM: product.Paper_GSM,
        Product_Description: product.Product_Description,
        HS_Code: product.HS_Code ?? "",
        Customer_Description: product.Customer_Description ?? "",
        Created_At: product.Created_At,
        Updated_At: product.Updated_At,
      },
      201
    );
  } catch (err: any) {
    console.error("Customer Product Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
