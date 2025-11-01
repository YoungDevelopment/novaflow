/**
 * GET /api/order-items/fetch-all-order-items?order_id=[orderId]&page=[page]&limit=[limit]&search=[search]
 *
 * - Fixed sort: order_item_id ASC
 * - Pagination enabled
 * - Optional order_id filter
 * - Optional wildcard search (product_code, description, item_type, hs_code, unit)
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

    if (orderId) {
      where.push("oi.order_id = ?");
      params.push(orderId);
    }

    if (search) {
      where.push(
        "(oi.product_code LIKE ? OR oi.description LIKE ? OR oi.item_type LIKE ? OR oi.hs_code LIKE ? OR oi.unit LIKE ?)"
      );
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // ✅ Count rows
    const countSql = `
      SELECT COUNT(*) AS total
      FROM Order_Items oi
      ${whereClause};
    `;
    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total) || 0;

    // ✅ Select data
    const selectSql = `
      SELECT
        oi.order_item_id,
        oi.order_id,
        oi.movement,
        oi.product_code,
        oi.item_type,
        oi.description,
        oi.hs_code,
        oi.unit,
        oi.kg,
        oi.declared_price_per_unit,
        oi.declared_price_per_kg,
        oi.actual_price_per_unit,
        oi.actual_price_per_kg,
        oi.declared_amount,
        oi.actual_amount,
        oi.created_at,
        oi.updated_at
      FROM Order_Items oi
      ${whereClause}
      ORDER BY oi.order_item_id ASC
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
          search: search || "No Search Applied",
        },
      },
      200
    );
  } catch (error: any) {
    console.error("fetch-all-order-items error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to fetch order items",
      },
      500
    );
  }
}

