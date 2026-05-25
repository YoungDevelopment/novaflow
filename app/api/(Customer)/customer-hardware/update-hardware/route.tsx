/**
 * PATCH /api/customer-hardware/update-hardware
 *
 * Flow:
 *  - Validate input with Zod
 *  - Check Hardware_Code exists
 *  - If Customer_ID is passed → ensure customer exists
 *  - If Hardware_Name is passed → ensure exists in Hardware_Collection
 *  - If Hardware_Name + Hardware_Description + Customer_ID are passed → check duplicate
 *  - If Hardware_Code_Description is passed → ensure globally unique
 *  - Perform dynamic update & update Updated_At
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import {
  updateCustomerHardwareSchema,
  UpdateCustomerHardwareInput,
} from "../validators/updateCustomerHardwareValidator";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = updateCustomerHardwareSchema.safeParse(body);
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

    const input: UpdateCustomerHardwareInput = parsed.data;

    // 1. Ensure record exists
    const existing = await turso.execute(
      `SELECT * FROM Customer_Hardware_Code WHERE Hardware_Code = ? LIMIT 1`,
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

    const newCustomerId = input.Customer_ID ?? oldData.Customer_ID;
    const newHardwareName = input.Hardware_Name ?? oldData.Hardware_Name;
    const newDescription =
      input.Hardware_Description ?? oldData.Hardware_Description;

    // 2. If Customer_ID is provided → validate
    if (input.Customer_ID) {
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

    // 4. Prevent duplicate: Customer_ID + Hardware_Name + Hardware_Description
    const duplicateCheck = await turso.execute(
      `SELECT Hardware_Code
       FROM Customer_Hardware_Code
       WHERE Customer_ID = ? AND Hardware_Name = ? AND Hardware_Description = ?
         AND Hardware_Code != ?
       LIMIT 1`,
      [newCustomerId, newHardwareName, newDescription, input.Hardware_Code]
    );
    if (duplicateCheck.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message:
            "Duplicate found: This combination of Customer_ID, Hardware_Name, and Hardware_Description already exists.",
        },
        409
      );
    }

    // 5. Ensure Hardware_Code_Description is globally unique if provided
    if (input.Hardware_Code_Description) {
      const descriptionCheck = await turso.execute(
        `SELECT Hardware_Code FROM Customer_Hardware_Code
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
        values.push(val === "" ? null : val);
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
      `UPDATE Customer_Hardware_Code SET ${fields.join(
        ", "
      )} WHERE Hardware_Code = ?`,
      values
    );

    return jsonResponse({ message: "Hardware updated successfully" }, 200);
  } catch (err: any) {
    console.error("Customer Hardware Update Error:", err);
    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
