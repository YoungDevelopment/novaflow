/**
 * GET /api/hardware/fetch-all-hardware?Customer_ID=[customerId]&page=[page]&limit=[limit]&search=[search]
 *
 * - Fixed sort: Hardware_Code ASC
 * - Pagination enabled
 * - Optional Customer filter
 * - Optional wildcard search (Hardware_Name, Description, or Code_Description)
 * - NULL values converted to "" in response
 * - Uses jsonResponse / errorResponse utilities
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

    const customerId = url.searchParams.get("Customer_ID") || "";
    const search = url.searchParams.get("search") || "";

    if (page < 1 || limit < 1) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "page and limit must be positive integers",
        },
        400
      );
    }

    // ✅ Build WHERE clause dynamically
    const where: string[] = [];
    const params: any[] = [];

    if (customerId) {
      where.push("vh.Customer_ID = ?");
      params.push(customerId);
    }

    if (search) {
      where.push(
        "(vh.Hardware_Name LIKE ? OR vh.Hardware_Description LIKE ? OR vh.Hardware_Code_Description LIKE ? OR vh.HS_Code LIKE ? OR vh.Customer_Description LIKE ?)"
      );
      params.push(
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`,
        `%${search}%`
      );
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ✅ Count rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM Customer_Hardware_Code vh
      ${whereClause};
    `;
    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total) || 0;

    // ✅ Select data with join to customer name
    const selectSql = `
      SELECT
        vh.Hardware_Code,
        vh.Customer_ID,
        ven.Customer_Name,
        vh.Hardware_Name,
        vh.Hardware_Description,
        vh.Hardware_Code_Description,
        vh.HS_Code,
        vh.Customer_Description,
        vh.Created_At,
        vh.Updated_At
      FROM Customer_Hardware_Code vh
      LEFT JOIN customers ven ON vh.Customer_ID = ven.Customer_ID
      ${whereClause}
      ORDER BY vh.Hardware_Code ASC
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
          customerFiltered: customerId || "All Customers",
          search: search || "No Search Applied",
        },
      },
      200
    );
  } catch (error: any) {
    console.error("fetch-all-hardware error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to fetch hardware",
      },
      500
    );
  }
}
