import { z } from "zod";

export const deleteOrderChargeSchema = z.object({
  Order_Charges_ID: z.string().min(1, "Order_Charges_ID is required"),
});

export type DeleteOrderChargeInput = z.infer<typeof deleteOrderChargeSchema>;


