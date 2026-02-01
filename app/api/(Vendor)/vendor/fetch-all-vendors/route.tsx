// /app/api/vendor/fetch-all-vendors/route.ts
/**
 * GET /api/vendor/fetch-all-vendors?page=1&limit=10
 *
 * - Fixed sort: Vendor_Name ASC
 * - Pagination: page (default 1), limit (default 10, max 100)
 * - Database Query
 * - Converts NULL DB values to "" in response objects
 * - Uses jsonResponse / errorResponse from /app/api/response.ts
 *
 * Usage:
 * GET /api/vendor/fetch-all-vendors?page=1&limit=10
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toSafeInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const v = parseInt(value, 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function nullsToEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    out[k] = v === null || v === undefined ? "" : v;
  }
  return out;
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);

    const page = toSafeInt(url.searchParams.get("page"), DEFAULT_PAGE);
    const limitRaw = toSafeInt(url.searchParams.get("limit"), DEFAULT_LIMIT);
    const limit = Math.min(limitRaw, MAX_LIMIT);
    const offset = (page - 1) * limit;

    const search = url.searchParams.get("search") || ""; // ✅ only search, no vendor filter

    if (page < 1 || limit < 1) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "page and limit must be positive integers",
        },
        400
      );
    }

    // ✅ Build WHERE clause only for "search"
    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      where.push(
        "(Vendor_Name LIKE ? OR Vendor_Mask_ID LIKE ? OR NTN_Number LIKE ? OR STRN_Number LIKE ?)"
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ✅ Count Total Vendors
    const countSql = `
      SELECT COUNT(*) AS total
      FROM vendors
      ${whereClause};
    `;
    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total) || 0;

    // ✅ Fetch Paginated Vendor List
    const selectSql = `
      SELECT
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
        Created_At,
        Updated_At
      FROM vendors
      ${whereClause}
      ORDER BY Vendor_Name ASC
      LIMIT ? OFFSET ?;
    `;

    const rowsRes = await turso.execute(selectSql, [...params, limit, offset]);
    const rows = rowsRes?.rows ?? [];
    const data = rows.map(nullsToEmpty);

    return jsonResponse(
      {
        data,
        pagination: {
          total: totalNum,
          page,
          limit,
          totalPages: Math.max(1, Math.ceil(totalNum / limit)),
          search: search || "No Search Applied",
        },
      },
      200
    );
  } catch (err: any) {
    console.error("fetch-all-vendors error:", err);
    const message = err?.message ?? "Failed to fetch vendors";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}
