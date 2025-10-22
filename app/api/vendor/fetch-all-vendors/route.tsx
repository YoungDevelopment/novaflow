/**
 * GET All Vendors (Paginated & Sorted)
 *
 * Endpoint: GET /api/vendor/fetch-vendors
 * Query Parameters:
 *   - page: Page number (default: 1, min: 1)
 *   - limit: Records per page (default: 10, min: 1, max: 100)
 *   - sortBy: Sort field (default: "Vendor_ID", options: Vendor_ID, Vendor_Name, created_at)
 *   - sortOrder: Sort direction (default: "desc", options: asc, desc)
 *
 * Success Response (200):
 * {
 *   "vendors": [...],
 *   "pagination": {
 *     "total": 58,
 *     "page": 1,
 *     "limit": 10,
 *     "totalPages": 6
 *   }
 * }
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/response";

export async function GET(req: NextRequest) {
  try {
    // Step 1: Extract query parameters from URL
    const searchParams = req.nextUrl.searchParams;

    // Get page (default: 1)
    const pageParam = searchParams.get("page") || "1";
    const page = parseInt(pageParam, 10);

    // Get limit (default: 10)
    const limitParam = searchParams.get("limit") || "10";
    const limit = parseInt(limitParam, 10);

    // Get sort field (default: Vendor_ID)
    const sortBy = searchParams.get("sortBy") || "Vendor_ID";

    // Get sort order (default: desc)
    const sortOrder = searchParams.get("sortOrder") || "asc";

    // Step 2: Validate query parameters
    if (isNaN(page) || page < 1) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Page must be a positive number (minimum: 1)",
        },
        400
      );
    }

    if (isNaN(limit) || limit < 1 || limit > 100) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Limit must be between 1 and 100",
        },
        400
      );
    }

    // Step 3: Validate sort field (SQL injection protection)
    const allowedSortFields = [
      "Vendor_ID",
      "Vendor_Name",
      "created_at",
      "updated_at",
    ];
    const validSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : "Vendor_ID";

    // Step 4: Validate sort order
    const validSortOrder = sortOrder.toLowerCase() === "asc" ? "ASC" : "DESC";

    // Step 5: Calculate offset for pagination
    const offset = (page - 1) * limit;

    // Step 6: Get total count of vendors
    const countResult = await turso.execute(
      `SELECT COUNT(*) as total FROM vendors`
    );
    const total = Number(countResult.rows[0].total);

    // Step 7: Fetch paginated vendors with sorting
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
      ORDER BY ${validSortBy} ${validSortOrder}
      LIMIT ? OFFSET ?`,
      [limit, offset]
    );

    // Step 8: Transform NULL to empty strings
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

    // Step 9: Calculate total pages
    const totalPages = Math.ceil(total / limit);

    // Step 10: Return response with your exact pagination format
    return jsonResponse(
      {
        vendors,
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      },
      200
    );
  } catch (err: any) {
    console.error("Fetch vendors error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
        details: err.message,
      },
      500
    );
  }
}
