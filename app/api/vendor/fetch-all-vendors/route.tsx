// /app/api/vendor/fetch-all-vendors/route.ts
/**
 * GET /api/vendor/fetch-all-vendors?page=1&limit=10
 *
 * - Uses Turso via `turso.execute(sql, params)`
 * - Fixed sort: Vendor_Name ASC
 * - Pagination: page (default 1), limit (default 10, max 100)
 * - Converts NULL DB values to "" in response objects
 * - Uses jsonResponse / errorResponse from /app/api/response.ts
 *
 * Usage:
 * GET /api/vendor/fetch-all-vendors?page=1&limit=10
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/response";

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

    if (page < 1 || limit < 1) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "page and limit must be positive integers",
        },
        400
      );
    }

    // Count total rows
    const countRes = await turso.execute(
      `SELECT COUNT(*) AS total FROM vendors;`
    );
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total || 0);

    // Fetch paginated rows (explicit columns to preserve order/shape)
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
        Website
      FROM vendors
      ORDER BY Vendor_Name ASC
      LIMIT ? OFFSET ?;
    `;

    const rowsRes = await turso.execute(selectSql, [limit, offset]);
    const rows = rowsRes?.rows ?? [];

    // Map DB rows to ensure all keys present and NULL => ""
    const data = rows.map((r: Record<string, any>) => {
      // Some drivers return columns as arrays or objects; assume object shape as used elsewhere
      return nullsToEmpty(r);
    });

    const totalPages = Math.max(1, Math.ceil(totalNum / limit));

    return jsonResponse(
      {
        data,
        pagination: {
          total: totalNum,
          page,
          limit,
          totalPages,
        },
      },
      200
    );
  } catch (err: any) {
    console.error("fetch-all-vendors error:", err);

    // Try to surface useful DB error if present
    const message = err?.message ?? "Failed to fetch vendors";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}
