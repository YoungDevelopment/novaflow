// /app/api/customer/validators/deleteCustomerValidator.ts

import { z } from "zod";

export const deleteCustomerSchema = z.object({
  Customer_ID: z
    .string()
    .refine((value) => value.trim().length > 0, {
      message: "Customer_ID is required",
    })
    .trim()
    .min(1, "Customer_ID is required"),
});

export type DeleteCustomerInput = z.infer<typeof deleteCustomerSchema>;
