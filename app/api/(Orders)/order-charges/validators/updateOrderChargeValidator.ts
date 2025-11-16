import { z } from "zod";

export const updateOrderChargeSchema = z.object({
  Order_Charges_ID: z.string().min(1, "Order_Charges_ID is required"),
  Order_ID: z.string().min(1, "Order_ID is required"),
  Description: z.string().min(1, "Description is required"),
  Charges: z
    .number({
      required_error: "Charges is required",
      invalid_type_error: "Charges must be a number",
    })
    .min(0, "Charges must be non-negative"),
});

export type UpdateOrderChargeInput = z.infer<typeof updateOrderChargeSchema>;


