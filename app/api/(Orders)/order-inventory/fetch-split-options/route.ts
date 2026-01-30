/**
 * GET /api/order-inventory/fetch-split-options
 *
 * Query Parameters:
 * - product_code: Required original product code
 * - remaining_width: Required remaining width to match
 * - is_first_split: Optional boolean (default: false) - if true, exclude original width
 *
 * Returns valid product codes that can be used for splitting, matching:
 * - Same Vendor_ID, Adhesive_Type, Paper_GSM, Material
 * - Width <= remaining_width
 * - If is_first_split: Width < original_width
 * Sorted by Width ASC
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  fetchSplitOptionsSchema,
  FetchSplitOptionsInput,
} from "../validators/splitInventoryValidator";

function toSafeInt(value: string | null, fallback: number) {
  if (!value) return fallback;
  const v = parseInt(value, 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

function toSafeBool(value: string | null, fallback: boolean) {
  if (!value) return fallback;
  return value.toLowerCase() === "true";
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const productCode = url.searchParams.get("product_code");
    const remainingWidthStr = url.searchParams.get("remaining_width");
    const isFirstSplitStr = url.searchParams.get("is_first_split");

    // Parse and validate
    const remainingWidth = remainingWidthStr
      ? parseInt(remainingWidthStr, 10)
      : null;
    const isFirstSplit = toSafeBool(isFirstSplitStr, false);

    const parsed = fetchSplitOptionsSchema.safeParse({
      product_code: productCode,
      remaining_width: remainingWidth,
      is_first_split: isFirstSplit,
    });

    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid query parameters",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const input: FetchSplitOptionsInput = parsed.data;

    // First, fetch the original product to get its attributes
    const originalProduct = await turso.execute(
      `SELECT 
        Product_Code,
        Width,
        Vendor_ID,
        Adhesive_Type,
        Paper_GSM,
        Material
      FROM vendor_product_code
      WHERE Product_Code = ?
      LIMIT 1`,
      [input.product_code]
    );

    if (originalProduct.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFound",
          message: "Original product code not found",
        },
        404
      );
    }

    const original = originalProduct.rows[0] as any;
    const originalWidth = Number(original.Width) || 0;

    // Build query for valid split options
    const whereConditions: string[] = [];
    const params: any[] = [];

    // Match immutable attributes
    whereConditions.push("Vendor_ID = ?");
    params.push(original.Vendor_ID);

    whereConditions.push("Adhesive_Type = ?");
    params.push(original.Adhesive_Type);

    whereConditions.push("Paper_GSM = ?");
    params.push(original.Paper_GSM);

    whereConditions.push("Material = ?");
    params.push(original.Material);

    // Width constraint
    whereConditions.push("Width <= ?");
    params.push(input.remaining_width);

    // If first split, exclude original width
    if (input.is_first_split) {
      whereConditions.push("Width < ?");
      params.push(originalWidth);
    }

    const whereClause = `WHERE ${whereConditions.join(" AND ")}`;

    // Fetch valid options
    const optionsResult = await turso.execute(
      `SELECT 
        Product_Code,
        Width,
        Product_Description
      FROM vendor_product_code
      ${whereClause}
      ORDER BY Width ASC`,
      params
    );

    const options = (optionsResult.rows || []).map((row: any) => ({
      product_code: row.Product_Code || "",
      width: Number(row.Width) || 0,
      product_description: row.Product_Description || "",
    }));

    return jsonResponse(
      {
        options,
      },
      200
    );
  } catch (error: any) {
    console.error("fetch-split-options error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to fetch split options",
      },
      500
    );
  }
}
