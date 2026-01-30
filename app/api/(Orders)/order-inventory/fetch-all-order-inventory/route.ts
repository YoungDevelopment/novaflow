/**
 * GET /api/order-inventory/fetch-all-order-inventory
 *
 * Query Parameters:
 * - order_id: Optional filter by order_id
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 10, max: 100)
 * - mode: "available" (only groups with SUM(unit_quantity) > 0) or omitted for "all" (default: "all")
 * - search: Optional search term to filter by Product_Description or Hardware_Code_Description
 * - group_by: Group by field (e.g., "barcode_tag"). When set, returns aggregated data
 *
 * - Fixed sort: inventory_id ASC (or grouped field when group_by is used)
 * - Pagination enabled
 * - NULL values converted to "" in response
 * - Uses jsonResponse / errorResponse utilities
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 100;

// Allowed fields for grouping
const ALLOWED_GROUP_BY_FIELDS = [
  "barcode_tag",
  "product_code",
  "order_id",
  "type",
  "order_transaction_type",
  "order_payment_type",
];

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
    const mode = url.searchParams.get("mode") || ""; // Optional: "available" to filter, empty shows all
    const groupBy = url.searchParams.get("group_by") || "";
    const typeFilter = url.searchParams.get("type") || ""; // "product" or "hardware"
    const search = url.searchParams.get("search") || ""; // Optional search on description

    // Validate mode (only if provided)
    if (mode && mode !== "available") {
      return errorResponse(
        {
          error: "ValidationError",
          message: 'mode must be "available" or omitted to show all items',
        },
        400
      );
    }

    // Validate type filter
    if (typeFilter && typeFilter !== "product" && typeFilter !== "hardware") {
      return errorResponse(
        {
          error: "ValidationError",
          message: 'type must be either "product" or "hardware"',
        },
        400
      );
    }

    // Validate group_by field
    if (groupBy && !ALLOWED_GROUP_BY_FIELDS.includes(groupBy)) {
      return errorResponse(
        {
          error: "ValidationError",
          message: `group_by must be one of: ${ALLOWED_GROUP_BY_FIELDS.join(", ")}`,
        },
        400
      );
    }

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

    // Important: We do NOT filter rows by oi.unit_quantity here.
    // Inventory uses "delta rows" (including negative quantities for removals),
    // so availability must be computed on the aggregated SUM(unit_quantity).

    // Filter by type (product or hardware)
    if (typeFilter) {
      where.push(`LOWER(TRIM(oi.Type)) = '${typeFilter.toLowerCase()}'`);
    }

    // When grouping by barcode_tag, exclude NULL values
    if (groupBy === "barcode_tag") {
      where.push("oi.barcode_tag IS NOT NULL");
    }

    // Note: Search will be handled in the grouped query section where we have access to description fields
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    let countSql: string;
    let selectSql: string;
    let countParams: any[];
    let selectParams: any[];

    if (groupBy) {
      // Grouped query with aggregation
      const groupByField = groupBy === "type" ? "oi.Type" : `oi.${groupBy}`;
      const groupByAlias = groupBy === "type" ? "type" : groupBy;
      const havingClause = mode === "available" ? "HAVING SUM(oi.unit_quantity) > 0" : "";

      // Count groups (respecting HAVING when mode=available)
      countSql = `
        SELECT COUNT(*) AS total
        FROM (
          SELECT ${groupByField}
          FROM order_inventory oi
          ${whereClause}
          GROUP BY ${groupByField}
          ${havingClause}
        ) AS grouped;
      `;
      countParams = [...params];

      // Select with grouping and aggregation
      selectSql = `
        SELECT
          ${groupByField} as ${groupByAlias},
          SUM(oi.unit_quantity) AS total_unit_quantity,
          SUM(oi.kg_quantity) AS total_kg_quantity,
          COUNT(*) AS item_count
        FROM order_inventory oi
        ${whereClause}
        GROUP BY ${groupByField}
        ${havingClause}
        ORDER BY ${groupByField} ASC
        LIMIT ? OFFSET ?;
      `;
      selectParams = [...params, limit, offset];
    } else {
      // Group by barcode_tag to get collective totals
      // Add barcode_tag filter if not already present
      const groupWhere: string[] = [...where];
      if (!groupWhere.some(w => w.includes("barcode_tag IS NOT NULL"))) {
        groupWhere.push("oi.barcode_tag IS NOT NULL");
      }

      // Build HAVING clause based on mode
      // Only filter by quantity if mode is explicitly "available"
      // Otherwise show all items including zero quantities
      const havingClause = mode === "available" 
        ? "HAVING SUM(oi.unit_quantity) > 0" 
        : "";

      // Build joins based on type filter
      let productJoin = "";
      let hardwareJoin = "";
      let descriptionSelect = "";
      const searchWhere: string[] = [];
      const searchParams: any[] = [];

      if (typeFilter === "product") { 
        // Only join with vendor_product_code for products
        productJoin = `INNER JOIN vendor_product_code vpc 
          ON UPPER(TRIM(oi.product_code)) = UPPER(TRIM(vpc.Product_Code))
          AND LOWER(TRIM(oi.Type)) = 'product'`;
        descriptionSelect = "MAX(vpc.Product_Description) as description";
        if (search) {
          searchWhere.push("vpc.Product_Description LIKE ?");
          searchParams.push(`%${search}%`);
        }
      } else if (typeFilter === "hardware") {
        // Only join with Vendor_Hardware_code for hardware
        hardwareJoin = `INNER JOIN Vendor_Hardware_code vhc 
          ON UPPER(TRIM(oi.product_code)) = UPPER(TRIM(vhc.Hardware_Code))
          AND LOWER(TRIM(oi.Type)) = 'hardware'`;
        descriptionSelect = "MAX(vhc.Hardware_Code_Description) as description";
        if (search) {
          searchWhere.push("vhc.Hardware_Code_Description LIKE ?");
          searchParams.push(`%${search}%`);
        }
      } else {
        // Join with both tables (default behavior)
        productJoin = `LEFT JOIN vendor_product_code vpc 
          ON UPPER(TRIM(oi.product_code)) = UPPER(TRIM(vpc.Product_Code)) `;
        hardwareJoin = `LEFT JOIN Vendor_Hardware_code vhc 
          ON UPPER(TRIM(oi.product_code)) = UPPER(TRIM(vhc.Hardware_Code)) `;
        descriptionSelect =
          "MAX(COALESCE(vpc.Product_Description, vhc.Hardware_Code_Description)) as description";
        if (search) {
          searchWhere.push("(vpc.Product_Description LIKE ? OR vhc.Hardware_Code_Description LIKE ?)");
          searchParams.push(`%${search}%`, `%${search}%`);
        }
      }

      // Add search conditions to groupWhere
      const finalGroupWhere = [...groupWhere];
      if (searchWhere.length > 0) {
        finalGroupWhere.push(`(${searchWhere.join(" OR ")})`);
      }
      const finalGroupWhereClause = finalGroupWhere.length ? `WHERE ${finalGroupWhere.join(" AND ")}` : "";

      // Count distinct barcode_tags
      countSql = `
        SELECT COUNT(*) AS total
        FROM (
          SELECT
            UPPER(TRIM(oi.barcode_tag)) AS barcode_tag
          FROM order_inventory oi
          ${productJoin}
          ${hardwareJoin}
          ${finalGroupWhereClause}
          GROUP BY UPPER(TRIM(oi.barcode_tag))
          ${havingClause}
        ) AS grouped;
      `;
      countParams = [...params, ...searchParams];

      // Group by barcode_tag with aggregation
      selectSql = `
        SELECT
          UPPER(TRIM(oi.barcode_tag)) AS barcode_tag,
          MAX(UPPER(TRIM(oi.product_code))) AS product_code,
          MAX(LOWER(TRIM(oi.Type))) AS type,
          SUM(oi.unit_quantity) AS total_unit_quantity,
          MAX(oi.actual_price_per_unit) AS actaul_price_per_unit,
          COUNT(*) AS item_count,
          ${descriptionSelect}
        FROM order_inventory oi
        ${productJoin}
        ${hardwareJoin}
        ${finalGroupWhereClause}
        GROUP BY UPPER(TRIM(oi.barcode_tag))
        ${havingClause}
        ORDER BY UPPER(TRIM(oi.barcode_tag)) ASC
        LIMIT ? OFFSET ?;
      `;
      selectParams = [...params, ...searchParams, limit, offset];
    }

    // ✅ Count rows
    const countRes = await turso.execute(countSql, countParams);
    const total = countRes?.rows?.[0]?.total ?? 0;
    const totalNum =
      typeof total === "string" ? parseInt(total, 10) : Number(total) || 0;

    // ✅ Select data
    const rowsRes = await turso.execute(selectSql, selectParams);
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
        mode: mode || "all",
        type: typeFilter || null,
        group_by: groupBy || null,
      },
      200
    );
  } catch (error: any) {
    console.error("fetch-all-order-inventory error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to fetch order inventory",
      },
      500
    );
  }
}
