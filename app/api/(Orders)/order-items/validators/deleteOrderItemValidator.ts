import { z } from "zod";

export const deleteOrderItemSchema = z.object({
  order_item_id: z.string().min(1, "order_item_id is required"),
});

export type DeleteOrderItemInput = z.infer<typeof deleteOrderItemSchema>;

