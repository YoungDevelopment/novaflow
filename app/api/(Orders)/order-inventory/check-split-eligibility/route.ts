/**
 * GET /api/order-inventory/check-split-eligibility
 *
 * Query Parameters:
 * - inventory_id: Optional inventory ID to check (if provided, uses this)
 * - barcode_tag: Optional barcode tag (used if inventory_id not provided)
 * - product_code: Optional product code (used with barcode_tag)
 *
 * Returns eligibility status and product attributes needed for split validation.
 * Eligibility: unit_quantity > 0 AND type = 'product'
 * If barcode_tag is provided, sums all unit_quantity for that barcode_tag
 */

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import {
  checkSplitEligibilitySchema,
  CheckSplitEligibilityInput,
} from "../validators/splitInventoryValidator";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const inventoryId = url.searchParams.get("inventory_id");
    const barcodeTag = url.searchParams.get("barcode_tag");
    const productCode = url.searchParams.get("product_code");

    // If inventory_id is provided, use it; otherwise use barcode_tag + product_code
    let result;
    let unitQuantity = 0;
    let productCodeResult = "";
    let widthResult = 0;
    let vendorIdResult = "";
    let adhesiveTypeResult = "";
    let paperGsmResult = 0;
    let materialResult = "";

    if (inventoryId) {
      // Validate query parameters
      const parsed = checkSplitEligibilitySchema.safeParse({
        inventory_id: inventoryId,
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

      const input: CheckSplitEligibilityInput = parsed.data;

      // Query inventory with product details by inventory_id
      result = await turso.execute(
        `SELECT 
          oi.unit_quantity,
          oi.product_code,
          oi.Type,
          vpc.Width,
          vpc.Vendor_ID,
          vpc.Adhesive_Type,
          vpc.Paper_GSM,
          vpc.Material
        FROM order_inventory oi
        INNER JOIN vendor_product_code vpc
          ON UPPER(TRIM(oi.product_code)) = UPPER(TRIM(vpc.Product_Code))
        WHERE oi.inventory_id = ? AND LOWER(TRIM(oi.Type)) = 'product'
        LIMIT 1`,
        [input.inventory_id as string]
      );

      if (result.rows.length === 0) {
        return errorResponse(
          {
            error: "NotFound",
            message: "Inventory item not found or is not a product type",
          },
          404
        );
      }

      const row = result.rows[0] as any;
      unitQuantity = Number(row.unit_quantity) || 0;
      productCodeResult = String(row.product_code || "")
        .trim()
        .toUpperCase();
      widthResult = Number(row.Width) || 0;
      vendorIdResult = row.Vendor_ID || "";
      adhesiveTypeResult = row.Adhesive_Type || "";
      paperGsmResult = Number(row.Paper_GSM) || 0;
      materialResult = row.Material || "";
    } else if (barcodeTag && productCode) {
      // Query by barcode_tag and product_code (for grouped inventory)
      // First get one record for product details, then sum quantities
      result = await turso.execute(
        `SELECT 
          oi.inventory_id,
          oi.product_code,
          oi.Type,
          vpc.Width,
          vpc.Vendor_ID,
          vpc.Adhesive_Type,
          vpc.Paper_GSM,
          vpc.Material
        FROM order_inventory oi
        INNER JOIN vendor_product_code vpc
          ON UPPER(TRIM(oi.product_code)) = UPPER(TRIM(vpc.Product_Code))
        WHERE UPPER(TRIM(oi.barcode_tag)) = UPPER(TRIM(?))
          AND UPPER(TRIM(oi.product_code)) = UPPER(TRIM(?))
          AND LOWER(TRIM(oi.Type)) = 'product'
        ORDER BY oi.inventory_id ASC
        LIMIT 1`,
        [barcodeTag, productCode]
      );

      if (result.rows.length === 0) {
        return errorResponse(
          {
            error: "NotFound",
            message: "Inventory item not found or is not a product type",
          },
          404
        );
      }

      const row = result.rows[0] as any;
      productCodeResult = String(row.product_code || "")
        .trim()
        .toUpperCase();
      widthResult = Number(row.Width) || 0;
      vendorIdResult = row.Vendor_ID || "";
      adhesiveTypeResult = row.Adhesive_Type || "";
      paperGsmResult = Number(row.Paper_GSM) || 0;
      materialResult = row.Material || "";
      
      // Get the total quantity by summing all records with this barcode_tag and product_code
      const totalResult = await turso.execute(
        `SELECT SUM(oi.unit_quantity) as total_unit_quantity
         FROM order_inventory oi
         WHERE UPPER(TRIM(oi.barcode_tag)) = UPPER(TRIM(?))
           AND UPPER(TRIM(oi.product_code)) = UPPER(TRIM(?))
           AND LOWER(TRIM(oi.Type)) = 'product'`,
        [barcodeTag, productCode]
      );
      
      if (totalResult.rows.length > 0) {
        unitQuantity = Number(totalResult.rows[0].total_unit_quantity) || 0;
      }
    } else {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Either inventory_id or (barcode_tag and product_code) must be provided",
        },
        400
      );
    }

    const eligible = unitQuantity > 0;
    
    // Get inventory_id for submit-split (use first one if querying by barcode_tag)
    let inventoryIdForSplit = inventoryId || "";
    if (!inventoryId && barcodeTag && productCode && result.rows.length > 0) {
      inventoryIdForSplit = String(result.rows[0].inventory_id ?? "");
    }

    return jsonResponse(
      {
        eligible,
        available_sqm: unitQuantity,
        product_code: productCodeResult,
        original_width: widthResult,
        vendor_id: vendorIdResult,
        adhesive_type: adhesiveTypeResult,
        paper_gsm: paperGsmResult,
        material: materialResult,
        inventory_id: inventoryIdForSplit, // Return inventory_id for submit-split
      },
      200
    );
  } catch (error: any) {
    console.error("check-split-eligibility error:", error);
    return errorResponse(
      {
        error: "InternalError",
        message: error.message || "Failed to check split eligibility",
      },
      500
    );
  }
}
