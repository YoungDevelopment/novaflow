import { z } from "zod";

export const deleteVendorProductSchema = z.object({
  Product_Code: z
    .string({
      message: "Product_Code is required",
    })
    .trim()
    .min(1, { message: "Product_Code is required" })
    .regex(/^VPC-\d+$/, "Invalid Product_Code format (e.g., VPC-1)"),
});

export type DeleteVendorProductInput = z.infer<
  typeof deleteVendorProductSchema
>;
