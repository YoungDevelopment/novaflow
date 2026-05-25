/**
 * POST /api/customer-hardware/create-new-hardware
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Customer_ID exists
 *  - Check Hardware_Name exists in Hardware_Name_Collection
 *  - Ensure the same Hardware_Name + Hardware_Description for the same Customer does NOT exist
 *  - Ensure the Hardware_Code_Description does NOT exist anywhere in the table
 *  - Generate Hardware_Code using id-generator.ts (Prefix: CHC)
 *  - Insert into Customer_Hardware_Code table
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { generateCustomId } from "@/app/api/utils/id-generator";
import {
  createCustomerHardwareSchema,
  CreateCustomerHardwareInput,
} from "../validators/createCustomerHardwareValidator";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = createCustomerHardwareSchema.safeParse(body);
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

    const input: CreateCustomerHardwareInput = parsed.data;

    // 1. Check Customer exists
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

    // 3. Ensure the same Hardware_Name + Hardware_Description for the same Customer does NOT exist
    const existingHardware = await turso.execute(
      `SELECT Hardware_Code FROM Customer_Hardware_Code
       WHERE Customer_ID = ? AND Hardware_Name = ? AND Hardware_Description = ? LIMIT 1`,
      [input.Customer_ID, input.Hardware_Name, input.Hardware_Description]
    );
    if (existingHardware.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message:
            "A hardware with the same Hardware_Name and Hardware_Description already exists for this customer.",
        },
        409
      );
    }

    // 4. Ensure the Hardware_Code_Description does NOT exist anywhere in the table
    const duplicateDescription = await turso.execute(
      `SELECT Hardware_Code FROM Customer_Hardware_Code
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

    // 5. Generate Hardware_Code (Prefix CHC)
    const newHardwareCode = await generateCustomId({
      tableName: "Customer_Hardware_Code",
      idColumnName: "Hardware_Code",
      prefix: "CHC",
    });

    // 6. Insert record
    await turso.execute(
      `INSERT INTO Customer_Hardware_Code (
        Hardware_Code, Customer_ID, Hardware_Name, Hardware_Description, Hardware_Code_Description, HS_Code, Customer_Description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        newHardwareCode,
        input.Customer_ID,
        input.Hardware_Name,
        input.Hardware_Description,
        input.Hardware_Code_Description,
        input.HS_Code ?? null,
        input.Customer_Description ?? null,
      ]
    );

    return jsonResponse({ message: "Hardware created successfully" }, 200);
  } catch (err: any) {
    console.error("Customer Hardware Create Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
