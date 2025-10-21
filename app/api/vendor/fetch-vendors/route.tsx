/**
 * GET All Vendors
 *
 * Endpoint: GET /api/vendor/fetch-vendors
 * Description: Fetches all vendor records from the database
 *
 * Success Response (200):
 * {
 *   "vendors": [
 *     {
 *       "Vendor_ID": "VDR-1",
 *       "Vendor_Name": "Acme Corp",
 *       "Vendor_Mask_ID": "ACM001",
 *       "NTN_Number": "",
 *       "STRN_Number": "",
 *       "Address_1": "",
 *       "Address_2": "",
 *       "Contact_Number": "",
 *       "Contact_Person": "",
 *       "Email_ID": "",
 *       "Website": "",
 *       "created_at": "2024-01-01T00:00:00Z",
 *       "updated_at": "2024-01-01T00:00:00Z"
 *     },
 *     ...
 *   ],
 *   "total": 150
 * }
 *
 * Error Response (500):
 * {
 *   "error": "InternalError",
 *   "message": "Unexpected server error"
 * }
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/response";

export async function GET(req: NextRequest) {
  try {
    // Step 1: Fetch all vendors from database
    const result = await turso.execute(
      `SELECT 
        Vendor_ID,
        Vendor_Name,
        Vendor_Mask_ID,
        NTN_Number,
        STRN_Number,
        Address_1,
        Address_2,
        Contact_Number,
        Contact_Person,
        Email_ID,
        Website,
        created_at,
        updated_at
      FROM vendors 
      ORDER BY Vendor_ID DESC`
    );

    // Step 2: Transform NULL to empty strings
    const vendors = result.rows.map((row) => ({
      Vendor_ID: row.Vendor_ID as string,
      Vendor_Name: row.Vendor_Name as string,
      Vendor_Mask_ID: row.Vendor_Mask_ID as string,
      NTN_Number: (row.NTN_Number as string | null) ?? "",
      STRN_Number: (row.STRN_Number as string | null) ?? "",
      Address_1: (row.Address_1 as string | null) ?? "",
      Address_2: (row.Address_2 as string | null) ?? "",
      Contact_Number: (row.Contact_Number as string | null) ?? "",
      Contact_Person: (row.Contact_Person as string | null) ?? "",
      Email_ID: (row.Email_ID as string | null) ?? "",
      Website: (row.Website as string | null) ?? "",
      created_at: row.created_at as string,
      updated_at: row.updated_at as string,
    }));

    // Step 3: Return all vendors with count
    return jsonResponse(
      {
        vendors,
        total: vendors.length,
      },
      200
    );
  } catch (err: any) {
    console.error("Fetch vendors error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}
