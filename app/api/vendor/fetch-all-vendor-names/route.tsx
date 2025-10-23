import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";

// Convert null or undefined values to empty string
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
    // ✅ Fetch only needed columns (Vendor_Name, Vendor_Mask_ID)
    const sql = `
      SELECT
        Vendor_Name,
        Vendor_ID
      FROM vendors
      ORDER BY Vendor_ID ASC;
    `;

    const result = await turso.execute(sql);
    const rows = result?.rows ?? [];

    // ✅ Clean up null/undefined values
    const data = rows.map((row: Record<string, any>) => nullsToEmpty(row));

    // ✅ Successful JSON response
    return jsonResponse({ data }, 200);
  } catch (err: any) {
    console.error("fetch-all-simple-vendors error:", err);

    return errorResponse(
      {
        error: "InternalError",
        message: err?.message ?? "Failed to fetch vendor list",
      },
      500
    );
  }
}
