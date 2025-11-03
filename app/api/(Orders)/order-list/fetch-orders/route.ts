/**
 * GET /api/order-list/fetch-orders?type=Purchase&page=1&limit=10&entity_id=ENT-1&status=Active&start_date=2024-01-01&end_date=2024-01-31
 *
 * Fetches a paginated list of orders filtered by type, entity_id, status(es), and date range.
 * Returns paginated results with total count.
 * Returns 404 if no orders found.
 *
 * Usage:
 * GET /api/order-list/fetch-orders?type=Purchase
 * GET /api/order-list/fetch-orders?type=Purchase&page=1&limit=20
 * GET /api/order-list/fetch-orders?type=Purchase&entity_id=ENT-1
 * GET /api/order-list/fetch-orders?type=Purchase&status=Active
 * GET /api/order-list/fetch-orders?type=Purchase&status=Active,Completed,Pending
 * GET /api/order-list/fetch-orders?type=Purchase&created_date=2024-01-01
 * GET /api/order-list/fetch-orders?type=Purchase&start_date=2024-01-01&end_date=2024-01-31
 * GET /api/order-list/fetch-orders?type=Purchase&entity_id=ENT-1&status=Active,Completed&start_date=2024-01-01&end_date=2024-01-31&page=1&limit=10
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  fetchOrderListSchema,
  FetchOrderListInput,
} from "../validators/fetchOrderListValidator";

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

    // Extract query parameters
    const type = url.searchParams.get("type");
    const page = url.searchParams.get("page");
    const limit = url.searchParams.get("limit");
    const entityId = url.searchParams.get("entity_id");
    const status = url.searchParams.get("status");
    const createdDate = url.searchParams.get("created_date");
    const startDate = url.searchParams.get("start_date");
    const endDate = url.searchParams.get("end_date");

    // ✅ Validate parameters using Zod
    const parsed = fetchOrderListSchema.safeParse({
      type,
      page,
      limit,
      entity_id: entityId,
      status,
      created_date: createdDate,
      start_date: startDate,
      end_date: endDate,
    });

    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request parameters",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const validatedData: FetchOrderListInput = parsed.data;
    const offset = (validatedData.page! - 1) * validatedData.limit!;

    // ✅ Build WHERE clause for filtering
    const where: string[] = [];
    const params: any[] = [];

    // type is required, always filter by it
    where.push("type = ?");
    params.push(validatedData.type);

    // Optional filters
    if (validatedData.entity_id) {
      where.push("entity_id LIKE ?");
      params.push(`%${validatedData.entity_id}%`);
    }

    // Handle multiple status values
    if (validatedData.status && validatedData.status.length > 0) {
      // Use IN clause for multiple status values
      const placeholders = validatedData.status.map(() => "?").join(",");
      where.push(`status IN (${placeholders})`);
      params.push(...validatedData.status);
    }

    // Handle created_date filter (exact date match)
    if (validatedData.created_date) {
      where.push("DATE(created_at) = ?");
      params.push(validatedData.created_date);
    }

    // Handle date range filter (start_date and end_date)
    if (validatedData.start_date && validatedData.end_date) {
      where.push("DATE(created_at) >= ? AND DATE(created_at) <= ?");
      params.push(validatedData.start_date, validatedData.end_date);
    } else if (validatedData.start_date) {
      where.push("DATE(created_at) >= ?");
      params.push(validatedData.start_date);
    } else if (validatedData.end_date) {
      where.push("DATE(created_at) <= ?");
      params.push(validatedData.end_date);
    }

    const whereClause = `WHERE ${where.join(" AND ")}`;

    // ✅ Count total matching orders
    const countSql = `
      SELECT COUNT(*) AS total
      FROM orders
      ${whereClause};
    `;

    const countRes = await turso.execute(countSql, params);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total) || 0;

    // ✅ Fetch paginated order list
    const selectSql = `
      SELECT 
        order_id,
        user,
        type,
        company,
        status,
        total_due,
        entity_id,
        created_at,
        updated_at
      FROM orders
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?;
    `;

    const rowsRes = await turso.execute(selectSql, [
      ...params,
      validatedData.limit!,
      offset,
    ]);
    const rows = rowsRes?.rows ?? [];

    // ✅ Check if any orders found
    if (rows.length === 0) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: "No orders found matching the criteria",
        },
        404
      );
    }

    // ✅ Clean up null/undefined values
    const data = rows.map(nullsToEmpty);

    // ✅ Return paginated results
    return jsonResponse(
      {
        data,
        pagination: {
          total: totalNum,
          page: validatedData.page!,
          limit: validatedData.limit!,
          totalPages: Math.max(1, Math.ceil(totalNum / validatedData.limit!)),
        },
      },
      200
    );
  } catch (err: any) {
    console.error("Fetch orders list error:", err);
    const message = err?.message ?? "Failed to fetch orders";
    return errorResponse({ error: "InternalError", message }, 500);
  }
}
