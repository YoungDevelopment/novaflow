// /app/api/vendor/fetch-all-vendors/route.ts
/**
 * GET /api/vendor/fetch-all-vendors?Vendor_ID=[vendorId]&page=[page]&limit=[limit]
 *
 * 1. Validate page and limit
 * 2. Validate Vendor_ID
 * 3. Count rows
 * 4. Fetch joined data
 * 5. Convert NULL values to ""
 * 6. Return data with pagination information
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

    const vendorId = url.searchParams.get("Vendor_ID"); // ✅ Optional

    if (page < 1 || limit < 1) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "page and limit must be positive integers",
        },
        400
      );
    }

    // ✅ WHERE for vendor or all
    const whereClause = vendorId ? "WHERE vpc.Vendor_ID = ?" : "";
    const params = vendorId ? [vendorId] : [];

    // ✅ Count rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM vendor_product_code vpc
      ${whereClause};
    `;
    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total || 0);

    // ✅ Fetch joined data
    const selectSql = `
      SELECT
        vpc.Product_Code,
        vpc.Vendor_ID,
        ven.Vendor_Name,
        vpc.Material,
        vpc.Width,
        vpc.Adhesive_Type,
        vpc.Paper_GSM,
        vpc.Product_Description,
        vpc.Created_At,
        vpc.Updated_At
      FROM vendor_product_code vpc
      LEFT JOIN vendors ven ON vpc.Vendor_ID = ven.Vendor_ID
      ${whereClause}
      ORDER BY vpc.Product_Code ASC
      LIMIT ? OFFSET ?;
    `;

    const rowsRes = vendorId
      ? await turso.execute(selectSql, [...params, limit, offset])
      : await turso.execute(selectSql, [limit, offset]);

    const rows = rowsRes?.rows ?? [];
    const data = rows.map((r: Record<string, any>) => nullsToEmpty(r));

    const totalPages = Math.max(1, Math.ceil(totalNum / limit));

    return jsonResponse(
      {
        data,
        pagination: {
          total: totalNum,
          page,
          limit,
          totalPages,
          vendorFiltered: vendorId || "All Vendors",
        },
      },
      200
    );
  } catch (err: any) {
    console.error("fetch-all-products error:", err);
    return errorResponse(
      {
        error: "InternalError",
        message: err?.message ?? "Failed to fetch products",
      },
      500
    );
  }
}
