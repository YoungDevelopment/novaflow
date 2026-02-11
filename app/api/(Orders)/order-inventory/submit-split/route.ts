/**
 * POST /api/order-inventory/submit-split
 *
 * Request Body:
 * {
 *   inventory_id: string;
 *   requested_length_m: number;
 *   splits: Array<{ product_code: string }>;
 * }
 *
 * Split rules:
 * - Widths are validated and handled as millimeters (integers).
 * - All area math is computed in meters.
 * - Sum of split widths cannot exceed master width.
 * - Child SQM = child_width_m * requested_length_m.
 * - Leftover SQM = leftover_width_m * requested_length_m.
 * - Conservation is enforced with floating-point tolerance.
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  submitSplitSchema,
  SubmitSplitInput,
} from "../validators/splitInventoryValidator";
import { generateCustomId } from "@/app/api/utils/id-generator";

const AREA_TOLERANCE = 1e-6;

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

function toAreaSqm(widthMm: number, lengthM: number) {
  return (widthMm / 1000) * lengthM;
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

    // 1. Fetch and validate original inventory row
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
    const originalProductCode = String(originalInventory.product_code || "");
    const originalWidthMm = Number(originalInventory.original_width);
    const originalVendorId = originalInventory.Vendor_ID || "";
    const originalAdhesiveType = originalInventory.Adhesive_Type || "";
    const originalPaperGsm = Number(originalInventory.Paper_GSM) || 0;
    const originalMaterial = originalInventory.Material || "";
    const originalTypeRaw =
      (originalInventory.Type as string | undefined) ??
      (originalInventory.type as string | undefined) ??
      "product";

    if (!Number.isInteger(originalWidthMm) || originalWidthMm <= 0) {
      return errorResponse(
        {
          error: "ValidationError",
          message:
            "Original roll width must be a positive integer in millimeters",
          details: { original_width: originalInventory.original_width },
        },
        400
      );
    }

    // 2. Compute available SQM (same barcode bucket) and validate length-derived master area
    const requestedLengthM = input.requested_length_m;
    if (!Number.isFinite(requestedLengthM) || requestedLengthM <= 0) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "requested_length_m must be a positive number",
        },
        400
      );
    }

    // IMPORTANT: Use persisted barcode_tag first to avoid formatting mismatches.
    const originalBarcodeTag =
      (originalInventory.barcode_tag as string | null) ??
      generateBarcodeTag(
        originalProductCode,
        originalInventory.actual_price_per_unit
      );

    const availableRes = await turso.execute(
      `SELECT SUM(unit_quantity) AS available_sqm
       FROM order_inventory
       WHERE barcode_tag = ?
         AND product_code = ?
         AND LOWER(TRIM(Type)) = 'product'`,
      [originalBarcodeTag, originalProductCode]
    );

    const availableSqm = Number(availableRes?.rows?.[0]?.available_sqm ?? 0) || 0;
    const masterSplitSqm = toAreaSqm(originalWidthMm, requestedLengthM);
    const maxSplittableLengthM =
      originalWidthMm > 0 ? availableSqm / (originalWidthMm / 1000) : 0;

    if (masterSplitSqm > availableSqm + AREA_TOLERANCE) {
      return errorResponse(
        {
          error: "ValidationError",
          message:
            "Requested split length exceeds available inventory for this roll",
          details: {
            requested_length_m: requestedLengthM,
            max_split_length_m: maxSplittableLengthM,
            requested_split_sqm: masterSplitSqm,
            available_sqm: availableSqm,
            product_code: originalProductCode,
            barcode_tag: originalBarcodeTag,
          },
        },
        400
      );
    }

    // 3. Fetch selected split product codes (duplicates allowed in payload)
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

    const productByCode = new Map<string, any>(
      (splitProductsResult.rows as any[]).map((p) => [p.Product_Code as string, p])
    );

    // 4. Validate product compatibility and width constraints
    let totalSplitWidthMm = 0;
    const splitWidthsMm: number[] = [];

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

      const widthMm = Number(product.Width);
      if (!Number.isInteger(widthMm) || widthMm <= 0) {
        return errorResponse(
          {
            error: "ValidationError",
            message:
              "Each split width must be a positive integer in millimeters",
            details: { product_code: code, width: product.Width },
          },
          400
        );
      }

      // Prevent no-op "split" on first row using the same full master width.
      if (i === 0 && widthMm >= originalWidthMm) {
        return errorResponse(
          {
            error: "ValidationError",
            message:
              "First split width must be less than master width to perform a split",
          },
          400
        );
      }

      totalSplitWidthMm += widthMm;
      splitWidthsMm.push(widthMm);
    }

    if (totalSplitWidthMm > originalWidthMm) {
      return errorResponse(
        {
          error: "ValidationError",
          message:
            "Invalid split configuration: sum of split widths exceeds master width",
          details: {
            master_width_mm: originalWidthMm,
            selected_width_mm: totalSplitWidthMm,
          },
        },
        400
      );
    }

    // 5. Compute child SQM + leftover SQM using length-driven math
    const leftoverWidthMm = originalWidthMm - totalSplitWidthMm;
    const splitAreasSqm = splitWidthsMm.map((widthMm) =>
      toAreaSqm(widthMm, requestedLengthM)
    );
    const splitAreasTotalSqm = splitAreasSqm.reduce((sum, sqm) => sum + sqm, 0);
    const leftoverSqm = toAreaSqm(leftoverWidthMm, requestedLengthM);
    const reconstructedMasterSqm = splitAreasTotalSqm + leftoverSqm;

    const conservationDelta = Math.abs(reconstructedMasterSqm - masterSplitSqm);
    const allowedConservationDelta =
      AREA_TOLERANCE * Math.max(1, masterSplitSqm);
    if (conservationDelta > allowedConservationDelta) {
      return errorResponse(
        {
          error: "ValidationError",
          message:
            "Split calculation failed conservation check (area mismatch detected)",
          details: {
            master_split_sqm: masterSplitSqm,
            split_rows_sqm: splitAreasTotalSqm,
            leftover_sqm: leftoverSqm,
            conservation_delta: conservationDelta,
            allowed_delta: allowedConservationDelta,
          },
        },
        400
      );
    }

    // 6. Execute auditable ledger inserts
    // - Negative entry for transformed master area
    // - Optional positive entry back to original for leftover strip area
    // - Positive entries for each selected split row
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

    // Log the operation for traceability/audit.
    console.info("submit-split operation", {
      inventory_id: input.inventory_id,
      original_product_code: originalProductCode,
      requested_length_m: requestedLengthM,
      master_width_mm: originalWidthMm,
      selected_width_mm: totalSplitWidthMm,
      leftover_width_mm: leftoverWidthMm,
      master_split_sqm: masterSplitSqm,
      split_rows_sqm: splitAreasTotalSqm,
      leftover_sqm: leftoverSqm,
    });

    // 6a. Negative master-area entry
    const negativeId = await generateCustomId({
      tableName: "order_inventory",
      idColumnName: "inventory_id",
      prefix: "INV",
    });
    await turso.execute(insertSql, [
      ...makeArgs(
        negativeId,
        originalProductCode,
        -masterSplitSqm,
        originalBarcodeTag
      ),
    ]);

    // 6b. Positive leftover entry back to original bucket (if any)
    if (leftoverSqm > AREA_TOLERANCE) {
      const leftoverId = await generateCustomId({
        tableName: "order_inventory",
        idColumnName: "inventory_id",
        prefix: "INV",
      });
      await turso.execute(insertSql, [
        ...makeArgs(
          leftoverId,
          originalProductCode,
          leftoverSqm,
          originalBarcodeTag
        ),
      ]);
    }

    // 6c. Positive entries for selected split products (duplicates allowed)
    const breakdown: Array<{
      inventory_id: string;
      product_code: string;
      width: number;
      allocated_sqm: number;
    }> = [];

    for (let i = 0; i < selectedProductCodes.length; i++) {
      const code = selectedProductCodes[i];
      const allocatedSqm = splitAreasSqm[i] ?? 0;
      const widthMm = splitWidthsMm[i] ?? 0;

      const newId = await generateCustomId({
        tableName: "order_inventory",
        idColumnName: "inventory_id",
        prefix: "INV",
      });

      await turso.execute(insertSql, makeArgs(newId, code, allocatedSqm));
      breakdown.push({
        inventory_id: newId,
        product_code: code,
        width: widthMm,
        allocated_sqm: allocatedSqm,
      });
    }

    return jsonResponse(
      {
        message: "Inventory split completed successfully",
        requested_length_m: requestedLengthM,
        total_split_sqm: splitAreasTotalSqm,
        leftover_width_mm: leftoverWidthMm,
        leftover_sqm: leftoverSqm,
        breakdown,
      },
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
