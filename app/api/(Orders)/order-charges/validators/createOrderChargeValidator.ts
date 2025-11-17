import { z } from "zod";

export const createOrderChargeSchema = z.object({
  Order_ID: z.string().min(1, "Order_ID is required"),
  Description: z.string().min(1, "Description is required"),
  Charges: z.number().min(0, "Charges must be a non-negative number"),
});

export type CreateOrderChargeInput = z.infer<typeof createOrderChargeSchema>;


