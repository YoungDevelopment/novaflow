// /app/api/customer/delete-customer/route.ts

import { NextRequest } from "next/server";
import { turso } from "@/lib/turso";
import { jsonResponse, errorResponse } from "@/app/api/utils/response";
import { deleteCustomerSchema } from "../validators/deleteCustomerValidator";

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body) {
      return errorResponse(
        { error: "ValidationError", message: "Request body must be JSON" },
        400
      );
    }

    // Validate customer ID
    const parsed = deleteCustomerSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        {
          error: "ValidationError",
          message: "Invalid Customer_ID",
          details: parsed.error.flatten(),
        },
        400
      );
    }

    const { Customer_ID } = parsed.data;

    // Check if customer exists
    const existingCustomer = await turso.execute(
      `SELECT Customer_ID FROM customers WHERE Customer_ID = ? LIMIT 1`,
      [Customer_ID]
    );

    if (existingCustomer.rows.length === 0) {
      return errorResponse(
        {
          error: "NotFoundError",
          message: "Customer not found",
        },
        404
      );
    }

    // Check for dependencies (hardware or products associated with this customer)
    const [hardwareCount, productCount] = await Promise.all([
      turso.execute(
        `SELECT COUNT(*) as count FROM Customer_Hardware_Code WHERE Customer_ID = ?`,
        [Customer_ID]
      ),
      turso.execute(
        `SELECT COUNT(*) as count FROM customer_product_code WHERE Customer_ID = ?`,
        [Customer_ID]
      ),
    ]);

    const hasHardware =
      hardwareCount.rows[0]?.count && Number(hardwareCount.rows[0]?.count) > 0;
    const hasProducts =
      productCount.rows[0]?.count && Number(productCount.rows[0]?.count) > 0;

    if (hasHardware || hasProducts) {
      const dependencies = [];
      if (hasHardware) dependencies.push("hardware codes");
      if (hasProducts) dependencies.push("product codes");

      return errorResponse(
        {
          error: "ConflictError",
          message: `Cannot delete customer. It has associated ${dependencies.join(
            " and "
          )}. Please remove all associated records before deleting this customer.`,
        },
        409
      );
    }

    // Delete customer
    await turso.execute(`DELETE FROM customers WHERE Customer_ID = ?`, [Customer_ID]);

    return jsonResponse(
      {
        message: "Customer deleted successfully",
        Customer_ID,
      },
      200
    );
  } catch (error: any) {
    console.error("Delete customer error:", error);

    // Handle foreign key constraint errors
    if (
      error?.message?.includes("FOREIGN KEY constraint") ||
      error?.code === "SQLITE_CONSTRAINT"
    ) {
      return errorResponse(
        {
          error: "ConflictError",
          message:
            "Cannot delete customer. It has associated records. Please remove all associated records before deleting this customer.",
        },
        409
      );
    }

    return errorResponse(
      { error: "InternalError", message: "Unexpected server error" },
      500
    );
  }
}
