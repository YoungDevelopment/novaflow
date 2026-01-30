/**
 * POST /api/order-inventory/submit-split
 *
 * Request Body:
 * {
 *   inventory_id: string;
 *   requested_sqm: number;
 *   splits: Array<{ product_code: string }>;
 * }
 *
 * Validates and executes inventory split:
 * 1. Inventory exists and has enough SQM
 * 2. All product codes exist
 * 3. All product codes match attributes (vendor, adhesive, GSM, material)
 * 4. Sum of widths equals original width
 * 5. Updates original inventory (decreases SQM)
 * 6. Updates or creates inventory records for split products
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  submitSplitSchema,
  SubmitSplitInput,
} from "../validators/splitInventoryValidator";
import { generateCustomId } from "@/app/api/utils/id-generator";

/**
 * Generate barcode_tag from product_code and actual_price_per_unit
 * Format: "product_code - actual_price_per_unit"
 */
function generateBarcodeTag(
  productCode: string,
  actualPricePerUnit?: number | null
): string | null {
  if (!productCode) return null;
  if (actualPricePerUnit === undefined || actualPricePerUnit === null) {
    return productCode;
  }
  return `${productCode} - ${actualPricePerUnit}`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    const parsed = submitSplitSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid request payload",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const input: SubmitSplitInput = parsed.data;

    // 1. Fetch and validate original inventory
    // First try by inventory_id, if not found, try to find one by barcode_tag if provided
    const inventoryResult = await turso.execute(
      `SELECT 
        oi.*,
        vpc.Width as original_width,
        vpc.Vendor_ID,
        vpc.Adhesive_Type,
        vpc.Paper_GSM,
        vpc.Material
      FROM order_inventory oi
      INNER JOIN vendor_product_code vpc ON oi.product_code = vpc.Product_Code
      WHERE oi.inventory_id = ? AND LOWER(TRIM(oi.Type)) = 'product'
      LIMIT 1`,
      [input.inventory_id]
    );

    // If not found by inventory_id, the frontend should have provided barcode_tag
    // For now, we'll require inventory_id to be valid
    // In the future, we could add barcode_tag support here too

    if (inventoryResult.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFound",
          message: "Inventory item not found or is not a product type",
        },
        404
      );
    }

    const originalInventory = inventoryResult.rows[0] as any;
    const originalWidth = Number(originalInventory.original_width) || 0;
    const originalVendorId = originalInventory.Vendor_ID || "";
    const originalAdhesiveType = originalInventory.Adhesive_Type || "";
    const originalPaperGsm = Number(originalInventory.Paper_GSM) || 0;
    const originalMaterial = originalInventory.Material || "";
    const originalTypeRaw =
      (originalInventory.Type as string | undefined) ??
      (originalInventory.type as string | undefined) ??
      "product";

    // 2. Compute available SQM (sum across the original bucket) and validate
    const originalProductCode = originalInventory.product_code as string;
    // IMPORTANT: Use the stored barcode_tag for availability calculations to avoid
    // formatting mismatches (e.g. "50" vs "50.00") causing SUM() to return 0.
    const originalBarcodeTag =
      (originalInventory.barcode_tag as string | null) ??
      generateBarcodeTag(originalProductCode, originalInventory.actual_price_per_unit);

    const availableRes = await turso.execute(
      `SELECT SUM(unit_quantity) AS available_sqm
       FROM order_inventory
       WHERE barcode_tag = ?
         AND product_code = ?
         AND LOWER(TRIM(Type)) = 'product'`,
      [originalBarcodeTag, originalProductCode]
    );
    const availableSqm = Number(availableRes?.rows?.[0]?.available_sqm ?? 0) || 0;

    if (input.requested_sqm > availableSqm) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Requested SQM exceeds available inventory",
          details: {
            requested_sqm: input.requested_sqm,
            available_sqm: availableSqm,
            product_code: originalProductCode,
            barcode_tag: originalBarcodeTag,
          },
        },
        400
      );
    }

    // 3. Fetch all split product codes (supports duplicates) and validate
    const selectedProductCodes = input.splits.map((s) => s.product_code);
    const uniqueProductCodes = Array.from(new Set(selectedProductCodes));
    const placeholders = uniqueProductCodes.map(() => "?").join(",");

    const splitProductsResult = await turso.execute(
      `SELECT 
        Product_Code,
        Width,
        Vendor_ID,
        Adhesive_Type,
        Paper_GSM,
        Material
      FROM vendor_product_code
      WHERE Product_Code IN (${placeholders})`,
      uniqueProductCodes
    );

    if (splitProductsResult.rows.length !== uniqueProductCodes.length) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "One or more product codes do not exist",
        },
        400
      );
    }

    const splitProducts = splitProductsResult.rows as any[];
    const productByCode = new Map<string, any>(
      splitProducts.map((p) => [p.Product_Code as string, p])
    );

    // 4-6. Validate configuration deterministically in row-order (supports duplicates)
    let totalWidth = 0;
    const splitWidths: number[] = [];
    for (let i = 0; i < selectedProductCodes.length; i++) {
      const code = selectedProductCodes[i];
      const product = productByCode.get(code);
      if (!product) {
        return errorResponse(
          { error: "ValidationError", message: "Invalid split configuration" },
          400
        );
      }

      if (product.Vendor_ID !== originalVendorId) {
        return errorResponse(
          {
            error: "ValidationError",
            message: `Product ${code} has different Vendor_ID`,
          },
          400
        );
      }
      if (product.Adhesive_Type !== originalAdhesiveType) {
        return errorResponse(
          {
            error: "ValidationError",
            message: `Product ${code} has different Adhesive_Type`,
          },
          400
        );
      }
      if (Number(product.Paper_GSM) !== originalPaperGsm) {
        return errorResponse(
          {
            error: "ValidationError",
            message: `Product ${code} has different Paper_GSM`,
          },
          400
        );
      }
      if (product.Material !== originalMaterial) {
        return errorResponse(
          {
            error: "ValidationError",
            message: `Product ${code} has different Material`,
          },
          400
        );
      }

      const width = Number(product.Width) || 0;
      if (width <= 0) {
        return errorResponse(
          { error: "ValidationError", message: "Invalid split configuration" },
          400
        );
      }

      // First split rule: width must be strictly less than original width
      if (i === 0 && width >= originalWidth) {
        return errorResponse(
          {
            error: "ValidationError",
            message: "Invalid split configuration",
          },
          400
        );
      }

      totalWidth += width;
      splitWidths.push(width);
    }

    if (originalWidth <= 0) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid original width for split allocation",
        },
        400
      );
    }

    if (totalWidth !== originalWidth) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Remaining width cannot be matched",
        },
        400
      );
    }

    // 6b. Allocate SQM proportionally to width (constant length assumption)
    // allocated_sqm_i = requested_sqm * (Wi / W0)
    const requestedSqm = input.requested_sqm;
    const allocationEpsilon = 1e-9;
    const allocations: number[] = [];
    let allocatedSum = 0;

    for (let i = 0; i < splitWidths.length; i++) {
      let allocated: number;
      if (i === splitWidths.length - 1) {
        // Make totals exact (avoid float drift)
        allocated = requestedSqm - allocatedSum;
      } else {
        allocated = requestedSqm * (splitWidths[i] / originalWidth);
      }

      // Clamp tiny float artifacts (e.g., -1e-15)
      if (Math.abs(allocated) < allocationEpsilon) {
        allocated = 0;
      }

      if (!Number.isFinite(allocated) || allocated < -allocationEpsilon) {
        return errorResponse(
          {
            error: "ValidationError",
            message: "Failed to allocate SQM for split rows",
            details: { allocated_sqm: allocated, row_index: i },
          },
          400
        );
      }

      // Final clamp to ensure non-negative inserts
      if (allocated < 0) allocated = 0;

      allocations.push(allocated);
      allocatedSum += allocated;
    }

    // Sanity: ensure conservation within epsilon
    if (Math.abs(allocatedSum - requestedSqm) > allocationEpsilon * 10) {
      return errorResponse(
        {
          error: "InternalError",
          message: "Split SQM allocation does not conserve total SQM",
          details: { requested_sqm: requestedSqm, allocated_sum: allocatedSum },
        },
        500
      );
    }

    // 7. Execute split operation as ledger inserts (auditable)
    // - Insert negative entry for original
    // - Insert positive entry for each resulting product (duplicates allowed)
    const insertSql = `INSERT INTO order_inventory (
      inventory_id,
      order_id,
      order_transaction_type,
      order_payment_type,
      Type,
      product_code,
      unit_quantity,
      kg_quantity,
      barcode_tag,
      declared_price_per_unit,
      declared_price_per_kg,
      actual_price_per_unit,
      actual_price_per_kg
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const makeArgs = (
      inventoryId: string,
      productCode: string,
      unitQty: number,
      barcodeTagOverride?: string | null
    ) => {
      const barcodeTag = generateBarcodeTag(
        productCode,
        originalInventory.actual_price_per_unit
      );
      return [
        inventoryId,
        originalInventory.order_id,
        originalInventory.order_transaction_type,
        originalInventory.order_payment_type,
        originalTypeRaw,
        productCode,
        unitQty,
        null, // kg_quantity is not mutated by split logic
        barcodeTagOverride ?? barcodeTag,
        originalInventory.declared_price_per_unit ?? null,
        originalInventory.declared_price_per_kg ?? null,
        originalInventory.actual_price_per_unit ?? null,
        originalInventory.actual_price_per_kg ?? null,
      ];
    };

    // IMPORTANT: generateCustomId() is not transaction-safe; if we generate multiple IDs
    // before inserting, we'll get duplicates. So we generate an ID and INSERT immediately,
    // like create-order-inventory does.

    // 7a. Negative entry for original product (same barcode_tag bucket)
    const negativeId = await generateCustomId({
      tableName: "order_inventory",
      idColumnName: "inventory_id",
      prefix: "INV",
    });
    await turso.execute(insertSql, [
      ...makeArgs(
        negativeId,
        originalProductCode,
        -requestedSqm,
        originalBarcodeTag
      ),
    ]);

    // 7b. Positive entries for each split selection (duplicates allowed)
    const breakdown: Array<{
      inventory_id: string;
      product_code: string;
      width: number;
      allocated_sqm: number;
    }> = [];

    for (let i = 0; i < selectedProductCodes.length; i++) {
      const code = selectedProductCodes[i];
      const allocatedSqm = allocations[i] ?? 0;
      const newId = await generateCustomId({
        tableName: "order_inventory",
        idColumnName: "inventory_id",
        prefix: "INV",
      });

      await turso.execute(insertSql, makeArgs(newId, code, allocatedSqm));
      breakdown.push({
        inventory_id: newId,
        product_code: code,
        width: splitWidths[i] ?? 0,
        allocated_sqm: allocatedSqm,
      });
    }

    return jsonResponse(
      { message: "Inventory split completed successfully", breakdown },
      200
    );
  } catch (error: any) {
    console.error("submit-split error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to submit split",
      },
      500
    );
  }
}
