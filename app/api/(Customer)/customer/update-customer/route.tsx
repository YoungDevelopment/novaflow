/**
 * PATCH /api/customer/update
 *
 * Updates only the fields provided in payload.
 * Validates input using Zod validator file.
 * Checks for duplicate Customer_Name or Customer_Mask_ID (case-insensitive).
 * Saves empty strings as NULL, but returns them as "".
 * Automatically updates Updated_At timestamp.
 * returns success message.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { errorResponse, jsonResponse } from "@/app/api/utils/response";
import { updateCustomerSchema, UpdateCustomerInput } from "../validators";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );

    // ✅ Validate payload using Zod schema
    const parsed = updateCustomerSchema.safeParse(body);
    if (!parsed.success)
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        400
      );

    const data: UpdateCustomerInput = parsed.data;

    // ✅ Check if customer exists
    const exist = await turso.execute(
      "SELECT * FROM customers WHERE Customer_ID = ? LIMIT 1",
      [data.Customer_ID]
    );
    if (exist.rows.length === 0)
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Customer with ID ${data.Customer_ID} not found`,
        },
        404
      );

    // ✅ Check duplicates (if name or mask is being updated)
    if (data.Customer_Name || data.Customer_Mask_ID) {
      const duplicate = await turso.execute(
        `SELECT Customer_ID FROM customers
         WHERE (LOWER(Customer_Name) = LOWER(?) OR LOWER(Customer_Mask_ID) = LOWER(?))
         AND Customer_ID != ? LIMIT 1`,
        [data.Customer_Name || "", data.Customer_Mask_ID || "", data.Customer_ID]
      );
      if (duplicate.rows.length > 0)
        return errorResponse(
          {
            error: "ConflictError",
            message: "Customer_Name or Customer_Mask_ID already exists",
          },
          409
        );
    }

    // ✅ Prepare dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    Object.entries(data).forEach(([key, val]) => {
      if (key !== "Customer_ID" && val !== undefined) {
        fields.push(`${key} = ?`);
        values.push(val === "" ? null : val);
      }
    });

    if (fields.length === 0)
      return errorResponse(
        { error: "ValidationError", message: "No fields provided to update" },
        400
      );

    // ✅ Add timestamp update
    fields.push("Updated_At = CURRENT_TIMESTAMP");
    values.push(data.Customer_ID);

    try {
      await turso.execute(
        `UPDATE customers SET ${fields.join(", ")} WHERE Customer_ID = ?`,
        values
      );
    } catch (updateErr: any) {
      console.error("Customer update DB error:", updateErr);
      return errorResponse(
        {
          error: "UpdateError",
          message: "Failed to update customer. Please try again later.",
        },
        500
      );
    }

    // Fetch and return the updated customer
    const updated = await turso.execute(
      "SELECT * FROM customers WHERE Customer_ID = ? LIMIT 1",
      [data.Customer_ID]
    );

    if (updated.rows.length === 0)
      return errorResponse(
        {
          error: "NotFoundError",
          message: "Customer not found after update",
        },
        404
      );

    const customer = updated.rows[0];
    // Return the updated customer with normalized optional fields
    return jsonResponse(
      {
        Customer_ID: customer.Customer_ID,
        Customer_Name: customer.Customer_Name,
        Customer_Mask_ID: customer.Customer_Mask_ID,
        NTN_Number: customer.NTN_Number ?? "",
        STRN_Number: customer.STRN_Number ?? "",
        Address_1: customer.Address_1 ?? "",
        Address_2: customer.Address_2 ?? "",
        Contact_Number: customer.Contact_Number ?? "",
        Contact_Person: customer.Contact_Person ?? "",
        Email_ID: customer.Email_ID ?? "",
        Website: customer.Website ?? "",
        Account_Number: customer.Account_Number ?? "",
        IBAN_Number: customer.IBAN_Number ?? "",
        Swift_Code: customer.Swift_Code ?? "",
        Bank_Name: customer.Bank_Name ?? "",
        Branch_Code: customer.Branch_Code ?? "",
        Notes: customer.Notes ?? "",
        Created_At: customer.Created_At,
        Updated_At: customer.Updated_At,
      },
      200
    );
  } catch (err: any) {
    console.error("Update customer error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
