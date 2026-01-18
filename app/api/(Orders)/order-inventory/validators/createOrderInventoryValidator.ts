import { z } from "zod";

export const createOrderInventorySchema = z.object({
  order_id: z.string().min(1, "order_id is required"),
  order_transaction_type: z
    .string()
    .min(1, "order_transaction_type is required"),
  order_payment_type: z.string().min(1, "order_payment_type is required"),
  type: z.string().min(1, "type is required"),
  product_code: z.string().min(1, "product_code is required"),
  unit_quantity: z.number().min(0).optional(),
  kg_quantity: z.number().min(0).optional(),
  declared_price_per_unit: z.number().min(0).optional(),
  declared_price_per_kg: z.number().min(0).optional(),
  actual_price_per_unit: z.number().min(0).optional(),
  actual_price_per_kg: z.number().min(0).optional(),
});

export type CreateOrderInventoryInput = z.infer<
  typeof createOrderInventorySchema
>;
