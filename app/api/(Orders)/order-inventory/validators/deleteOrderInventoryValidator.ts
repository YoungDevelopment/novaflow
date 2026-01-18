import { z } from "zod";

export const deleteOrderInventorySchema = z.object({
  inventory_id: z.string().min(1, "inventory_id is required"),
});

export type DeleteOrderInventoryInput = z.infer<
  typeof deleteOrderInventorySchema
>;
