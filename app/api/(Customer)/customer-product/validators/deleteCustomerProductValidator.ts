import { z } from "zod";

export const deleteCustomerProductSchema = z.object({
  Product_Code: z
    .string({
      message: "Product_Code is required",
    })
    .trim()
    .min(1, { message: "Product_Code is required" })
    .regex(/^CPC-\d+$/, "Invalid Product_Code format (e.g., CPC-1)"),
});

export type DeleteCustomerProductInput = z.infer<
  typeof deleteCustomerProductSchema
>;
