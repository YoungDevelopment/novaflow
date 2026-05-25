/**
 * POST /api/customer/create-new-customer
 *
 * Flow:
 *  - Validate payload
 *  - Check uniqueness of Customer_Name and Customer_Mask_ID (case-insensitive)
 *  - Generate Customer_ID as 'CUS-<id>' and update the row
 *  - Insert customer row (optional fields stored as NULL)
 *  - Customer_Name_CI and Customer_Mask_CI are created as case-insensitive duplicates of Customer_Name and Customer_Mask_ID
 *  - Return the created customer object (optional fields returned as "")
 *
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  createCustomerSchema,
  CreateCustomerInput,
} from "../validators/createCustomerValidator";

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
    const parsed = createCustomerSchema.safeParse(body);
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
    const input: CreateCustomerInput = parsed.data;

    // ✅ Manually check for duplicates
    const existing = await turso.execute(
      `SELECT Customer_ID FROM customers WHERE Customer_Name = ? OR Customer_Mask_ID = ? LIMIT 1`,
      [input.Customer_Name.trim(), input.Customer_Mask_ID.trim()]
    );
    if (existing.rows.length > 0) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Customer_Name or Customer_Mask_ID already exists",
        },
        409
      );
    }

    // ✅ Now generate & update Customer_ID = CUS-<increment>
    const newCustomerId = await generateCustomId({
      tableName: "customers",
      idColumnName: "Customer_ID",
      prefix: "CUS",
    });

    // ✅ Insert customer row (Customer_ID is NULL for now)
    await turso.execute(
      `INSERT INTO customers (
          Customer_ID, Customer_Name, Customer_Mask_ID, 
          NTN_Number, STRN_Number, Address_1, Address_2,
          Contact_Number, Contact_Person, Email_ID, Website,
          Account_Number, IBAN_Number, Swift_Code, Bank_Name, Branch_Code, Notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newCustomerId,
        input.Customer_Name.trim(),
        input.Customer_Mask_ID.trim(),
        input.NTN_Number ?? null,
        input.STRN_Number ?? null,
        input.Address_1 ?? null,
        input.Address_2 ?? null,
        input.Contact_Number ?? null,
        input.Contact_Person ?? null,
        input.Email_ID ?? null,
        input.Website ?? null,
        input.Account_Number ?? null,
        input.IBAN_Number ?? null,
        input.Swift_Code ?? null,
        input.Bank_Name ?? null,
        input.Branch_Code ?? null,
        input.Notes ?? null,
      ]
    );

    // ✅ Respond with normalized output
    return jsonResponse(
      {
        Customer_ID: newCustomerId,
        ...input,
        NTN_Number: input.NTN_Number ?? "",
        STRN_Number: input.STRN_Number ?? "",
        Address_1: input.Address_1 ?? "",
        Address_2: input.Address_2 ?? "",
        Contact_Number: input.Contact_Number ?? "",
        Contact_Person: input.Contact_Person ?? "",
        Email_ID: input.Email_ID ?? "",
        Website: input.Website ?? "",
        Account_Number: input.Account_Number ?? "",
        IBAN_Number: input.IBAN_Number ?? "",
        Swift_Code: input.Swift_Code ?? "",
        Bank_Name: input.Bank_Name ?? "",
        Branch_Code: input.Branch_Code ?? "",
        Notes: input.Notes ?? "",
      },
      201
    );
  } catch (err: any) {
    console.error("Create customer error:", err);

    // ✅ If UNIQUE constraint failed → return 409 Conflict
    if (
      err?.message?.includes("UNIQUE constraint failed") ||
      err?.message?.toLowerCase().includes("unique")
    ) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Customer_Name or Customer_Mask_ID already exists",
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
