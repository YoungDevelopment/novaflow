/**
 * GET /api/customer/fetch-all-products?Customer_ID=[customerId]&page=[page]&limit=[limit]&search=[search]
 *
 * - Fixed sort: Product_Code ASC
 * - Pagination: page (default 1), limit (default 10, max 100)
 * - Database Query
 * - Converts NULL DB values to "" in response objects
 * - Uses jsonResponse / errorResponse from /app/api/response.ts
 *
 * Usage:
 * GET /api/customer/fetch-all-products?page=1&limit=10
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

    const customerId = url.searchParams.get("Customer_ID") || ""; // Optional
    const search = url.searchParams.get("search") || ""; // Optional wild-card search

    if (page < 1 || limit < 1) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "page and limit must be positive integers",
        },
        400
      );
    }

    // ✅ Build dynamic WHERE clause
    const whereConditions: string[] = [];
    const params: any[] = [];

    if (customerId) {
      whereConditions.push("vpc.Customer_ID = ?");
      params.push(customerId);
    }

    if (search) {
      whereConditions.push(
        "(vpc.Product_Description LIKE ? OR vpc.HS_Code LIKE ? OR vpc.Customer_Description LIKE ?)"
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length
      ? `WHERE ${whereConditions.join(" AND ")}`
      : "";

    // ✅ Count rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM customer_product_code vpc
      ${whereClause};
    `;
    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total || 0);

    // ✅ Fetch data with JOIN on customer
    const selectSql = `
      SELECT
        vpc.Product_Code,
        vpc.Customer_ID,
        ven.Customer_Name,
        vpc.Material,
        vpc.Width,
        vpc.Adhesive_Type,
        vpc.Paper_GSM,
        vpc.Product_Description,
        vpc.HS_Code,
        vpc.Customer_Description,
        vpc.Created_At,
        vpc.Updated_At
      FROM customer_product_code vpc
      LEFT JOIN customers ven ON vpc.Customer_ID = ven.Customer_ID
      ${whereClause}
      ORDER BY vpc.Product_Code ASC
      LIMIT ? OFFSET ?;
    `;

    const rowsRes = await turso.execute(selectSql, [...params, limit, offset]);

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
          customerFiltered: customerId || "All Customers",
          search: search || "No Search Applied",
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
