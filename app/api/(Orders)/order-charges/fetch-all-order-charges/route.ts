/**
 * GET /api/order-charges/fetch-all-order-charges
 *
 * - No search/filtering; supports optional pagination via ?page=&limit=
 * - Returns data and pagination meta
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";

function toSafeInt(value: string | null, fallback: number) {
  const n = value ? parseInt(value, 10) : NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = toSafeInt(searchParams.get("page"), 1);
    const limit = toSafeInt(searchParams.get("limit"), 10);
    const offset = (page - 1) * limit;

    const totalResult = await turso.execute(
      `SELECT COUNT(*) as total FROM Order_Charges`
    );
    const total = Number(totalResult.rows?.[0]?.total ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    const list = await turso.execute({
      sql: `SELECT Order_Charges_ID, Order_ID, Description, Charges
            FROM Order_Charges
            ORDER BY Order_Charges_ID DESC
            LIMIT ? OFFSET ?`,
      args: [limit, offset],
    });

    return jsonResponse({
      data: list.rows,
      meta: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error: any) {
    console.error("Fetch all order charges error:", error);
    return errorResponse(
      {
        error: "ServerError",
        message: "Failed to fetch order charges",
        details: error?.message,
      },
      500
    );
  }
}


