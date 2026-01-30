import { z } from "zod";

export const syncToInventorySchema = z.object({
  order_id: z.string().min(1, "order_id is required"),
});

export type SyncToInventoryInput = z.infer<typeof syncToInventorySchema>;
