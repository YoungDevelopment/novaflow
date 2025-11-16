import { z } from "zod";

export const createOrderChargeSchema = z.object({
  Order_ID: z.string().min(1, "Order_ID is required"),
  Description: z.string().min(1, "Description is required"),
  Charges: z
    .number({
      required_error: "Charges is required",
      invalid_type_error: "Charges must be a number",
    })
    .min(0, "Charges must be non-negative"),
});

export type CreateOrderChargeInput = z.infer<typeof createOrderChargeSchema>;


