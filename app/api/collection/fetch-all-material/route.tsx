// GET /api/collection/fetch-all-material

 const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

function toSafeInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const v = parseInt(value, 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";

function nullsToEmpty(obj: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    out[key] = val === null || val === undefined ? "" : val;
  }
  return out;
}

export async function GET(_req: NextRequest) {
  try {
    // ✅ Fetch only needed columns (Material_Name, Material_Mask_ID)
    const sql = `
      SELECT
        Material_Name,
        Material_Mask_ID
      FROM Material_Collection
      ORDER BY Material_Mask_ID ASC;
    `;

    const result = await turso.execute(sql);
    const rows = result?.rows ?? [];

    // ✅ Clean up null/undefined values
    const data = rows.map((row: Record<string, any>) => nullsToEmpty(row));

    // ✅ Successful JSON response
    return jsonResponse({ data }, 200);
  } catch (err: any) {
    console.error("fetch-all-material error:", err);

    return errorResponse(
      {
        error: "InternalError",
        message: err?.message ?? "Failed to fetch material list",
      },
      500
    );
  }
}
