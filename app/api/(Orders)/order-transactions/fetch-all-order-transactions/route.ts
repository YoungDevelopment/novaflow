/**
 * GET /api/order-transactions/fetch-all-order-transactions?order_id=[orderId]&page=[page]&limit=[limit]
 *
 * - Fixed sort: Order_Transcation_ID ASC
 * - Pagination enabled
 * - Optional order_id filter
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

    const orderId = url.searchParams.get("order_id") || "";

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

    if (orderId) {
      where.push("ot.Order_ID = ?");
      params.push(orderId);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ✅ Count rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM Order_Transactions ot
      ${whereClause};
    `;
    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total) || 0;

    // ✅ Select data
    const selectSql = `
      SELECT
        ot.Order_Transcation_ID,
        ot.Order_ID,
        ot.Transaction_Date,
        ot.Type,
        ot.Order_Payment_Type,
        ot.Payment_Method,
        ot.Actual_Amount,
        ot.Decalred_Amount,
        ot.Notes,
        ot.Created_Date,
        ot.created_at,
        ot.updated_at
      FROM Order_Transactions ot
      ${whereClause}
      ORDER BY ot.Order_Transcation_ID ASC
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
          orderFiltered: orderId || "All Orders",
        },
      },
      200
    );
  } catch (error: any) {
    console.error("fetch-all-order-transactions error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to fetch order transactions",
      },
      500
    );
  }
}
