import { z } from "zod";

export const updateOrderChargeSchema = z.object({
  Order_Charges_ID: z.string().min(1, "Order_Charges_ID is required"),
  Order_ID: z.string().min(1, "Order_ID is required"),
  Description: z.string().min(1, "Description is required"),
  Charges: z.number().min(0, "Charges must be a non-negative number"),
});

export type UpdateOrderChargeInput = z.infer<typeof updateOrderChargeSchema>;


