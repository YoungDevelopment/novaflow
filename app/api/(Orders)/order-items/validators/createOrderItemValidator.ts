import { z } from "zod";

export const createOrderItemSchema = z.object({
  order_id: z.string().min(1, "order_id is required"),
  movement: z.enum(["Y", "N"]).default("N").optional(),
  product_code: z.string().min(1, "product_code is required"),
  item_type: z.string().optional(),
  description: z.string().optional(),
  hs_code: z.string().optional(),
  unit: z.string().optional(),
  kg: z.number().nonnegative().default(0.0).optional(),
  declared_price_per_unit: z.number().nonnegative().default(0.0).optional(),
  declared_price_per_kg: z.number().nonnegative().default(0.0).optional(),
  actual_price_per_unit: z.number().nonnegative().default(0.0).optional(),
  actual_price_per_kg: z.number().nonnegative().default(0.0).optional(),
  declared_amount: z.number().nonnegative().default(0.0).optional(),
  actual_amount: z.number().nonnegative().default(0.0).optional(),
});

export type CreateOrderItemInput = z.infer<typeof createOrderItemSchema>;
