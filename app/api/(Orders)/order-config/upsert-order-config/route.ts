/**
 * POST /api/order-config/upsert-order-config
 * PATCH /api/order-config/upsert-order-config
 *
 * Flow:
 *  1. Validate payload (order_id is required)
 *  2. Check if order exists in orders table
 *  3. If not exists: Return 404 error (Order must exist first)
 *  4. Then check if order_config exists for this order_id
 *  5. If exists: UPDATE the existing order_config row (PATCH behavior)
 *  6. If not exists: INSERT a new order_config row
 *  7. Return the upserted order config object
 */
import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { generateCustomId } from "../../../utils/id-generator";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { upsertOrderConfigSchema, UpsertOrderConfigInput } from "../validators";
import { recalculateOrderTotalDue } from "@/app/api/utils/amount-calculator";

async function upsertHandler(req: NextRequest) {
  try {
    // ✅ Ensure valid JSON payload
    const body = await req.json().catch(() => null);
    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // ✅ Validate using Zod
    const parsed = upsertOrderConfigSchema.safeParse(body);
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
    const input: UpsertOrderConfigInput = parsed.data;

    // ✅ STEP 1: Check if order exists in orders table
    const checkOrderSql = `
      SELECT order_id
      FROM orders
      WHERE order_id = ?;
    `;
    const orderCheckResult = await turso.execute(checkOrderSql, [
      input.order_id,
    ]);
    const orderExists = orderCheckResult?.rows?.[0];

    // ✅ STEP 2: If order doesn't exist, throw an error
    if (!orderExists) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: `Order with ID ${input.order_id} not found in orders table. Please create the order first.`,
        },
        404
      );
    }

    // ✅ STEP 3: Check if order_config exists for this order_id
    const checkConfigSql = `
      SELECT order_config_id
      FROM order_config
      WHERE order_id = ?;
    `;
    const configCheckResult = await turso.execute(checkConfigSql, [
      input.order_id,
    ]);
    const existingConfig = configCheckResult?.rows?.[0];

    if (existingConfig) {
      // ✅ STEP 4: UPDATE existing order_config - PATCH behavior (only update provided fields)
      const updateFields: string[] = [];
      const updateValues: any[] = [];

      // Only include fields that are actually provided in the request
      if (input.tax_percentage !== undefined) {
        updateFields.push("tax_percentage = ?");
        updateValues.push(input.tax_percentage);
      }

      if (input.committed_date !== undefined) {
        updateFields.push("committed_date = ?");
        updateValues.push(input.committed_date || null);
      }

      if (input.entity_order !== undefined) {
        updateFields.push("entity_order = ?");
        updateValues.push(input.entity_order || null);
      }

      if (input.gate_pass !== undefined) {
        updateFields.push("gate_pass = ?");
        updateValues.push(input.gate_pass || null);
      }

      // Always update the updated_at timestamp
      updateFields.push("updated_at = CURRENT_TIMESTAMP");

      // Add order_id for WHERE clause
      updateValues.push(input.order_id);

      const updateSql = `
        UPDATE order_config
        SET ${updateFields.join(", ")}
        WHERE order_id = ?;
      `;

      await turso.execute(updateSql, updateValues);

      // ✅ Recalculate order total_due whenever any order config field is changed
      // This ensures the order amount stays in sync with tax percentage and other changes
      recalculateOrderTotalDue(input.order_id).catch((err) => {
        console.error(
          `Failed to recalculate total_due for order ${input.order_id}:`,
          err
        );
      });

      // ✅ Fetch the updated order_config row
      const fetchSql = `
        SELECT 
          order_config_id,
          order_id,
          tax_percentage,
          committed_date,
          entity_order,
          gate_pass,
          created_at,
          updated_at
        FROM order_config
        WHERE order_id = ?;
      `;
      const fetchResult = await turso.execute(fetchSql, [input.order_id]);
      const updatedRow = fetchResult?.rows?.[0];

      return jsonResponse(
        {
          order_config_id: updatedRow?.order_config_id || "",
          order_id: updatedRow?.order_id || input.order_id,
          tax_percentage: updatedRow?.tax_percentage ?? 0.0,
          committed_date: updatedRow?.committed_date || "",
          entity_order: updatedRow?.entity_order || "",
          gate_pass: updatedRow?.gate_pass || "",
          created_at: updatedRow?.created_at || new Date().toISOString(),
          updated_at: updatedRow?.updated_at || new Date().toISOString(),
        },
        200
      );
    } else {
      // ✅ STEP 5: INSERT new order_config row
      const newOrderConfigId = await generateCustomId({
        tableName: "order_config",
        idColumnName: "order_config_id",
        prefix: "OCG",
      });

      await turso.execute(
        `INSERT INTO order_config (
          order_config_id,
          order_id,
          tax_percentage,
          committed_date,
          entity_order,
          gate_pass
        ) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newOrderConfigId,
          input.order_id,
          input.tax_percentage ?? 0.0,
          input.committed_date || null,
          input.entity_order || null,
          input.gate_pass || null,
        ]
      );

      // ✅ Recalculate order total_due whenever order config is created
      // This ensures the order amount stays in sync with tax percentage and other changes
      recalculateOrderTotalDue(input.order_id).catch((err) => {
        console.error(
          `Failed to recalculate total_due for order ${input.order_id}:`,
          err
        );
      });

      // ✅ Fetch the created order_config row
      const fetchSql = `
        SELECT 
          order_config_id,
          order_id,
          tax_percentage,
          committed_date,
          entity_order,
          gate_pass,
          created_at,
          updated_at
        FROM order_config
        WHERE order_config_id = ?;
      `;
      const fetchResult = await turso.execute(fetchSql, [newOrderConfigId]);
      const createdRow = fetchResult?.rows?.[0];

      // ✅ Respond with the created order config
      return jsonResponse(
        {
          order_config_id: newOrderConfigId,
          order_id: input.order_id,
          tax_percentage: input.tax_percentage ?? 0.0,
          committed_date: input.committed_date || "",
          entity_order: input.entity_order || "",
          gate_pass: input.gate_pass || "",
          created_at: createdRow?.created_at || new Date().toISOString(),
          updated_at: createdRow?.updated_at || new Date().toISOString(),
        },
        201
      );
    }
  } catch (err: any) {
    console.error("Upsert order config error:", err);

    // ✅ If UNIQUE constraint failed → return 409 Conflict
    if (
      err?.message?.includes("UNIQUE constraint failed") ||
      err?.message?.toLowerCase().includes("unique")
    ) {
      return errorResponse(
        {
          error: "ConflictError",
          message: "Order config ID already exists",
        },
        409
      );
    }

    // ✅ Otherwise → return 500 internal
    return errorResponse(
      {
        error: "InternalError",
        message: "Unexpected server error",
      },
      500
    );
  }
}

// Export handlers for both POST and PATCH
export { upsertHandler as POST, upsertHandler as PATCH };
