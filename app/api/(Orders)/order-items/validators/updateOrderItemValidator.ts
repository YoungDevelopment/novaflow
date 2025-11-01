import { z } from "zod";

export const updateOrderItemSchema = z.object({
  order_item_id: z.string().min(1, "order_item_id is required"),
  order_id: z.string().min(1).optional(),
  movement: z.enum(["Y", "N"]).optional(),
  product_code: z.string().min(1).optional(),
  item_type: z.string().optional(),
  description: z.string().optional(),
  hs_code: z.string().optional().nullable(),
  unit: z.string().optional(),
  kg: z.number().nonnegative().optional(),
  declared_price_per_unit: z.number().nonnegative().optional(),
  declared_price_per_kg: z.number().nonnegative().optional(),
  actual_price_per_unit: z.number().nonnegative().optional(),
  actual_price_per_kg: z.number().nonnegative().optional(),
  declared_amount: z.number().nonnegative().optional(),
  actual_amount: z.number().nonnegative().optional(),
});

export type UpdateOrderItemInput = z.infer<typeof updateOrderItemSchema>;

