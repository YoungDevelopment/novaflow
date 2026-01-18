import { z } from "zod";

export const updateOrderInventorySchema = z.object({
  inventory_id: z.string().min(1, "inventory_id is required"),
  order_id: z.string().min(1).optional(),
  order_transaction_type: z.string().min(1).optional(),
  order_payment_type: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  product_code: z.string().min(1).optional(),
  unit_quantity: z.number().min(0).optional(),
  kg_quantity: z.number().min(0).optional(),
  declared_price_per_unit: z.number().min(0).optional(),
  declared_price_per_kg: z.number().min(0).optional(),
  actual_price_per_unit: z.number().min(0).optional(),
  actual_price_per_kg: z.number().min(0).optional(),
});

export type UpdateOrderInventoryInput = z.infer<
  typeof updateOrderInventorySchema
>;
