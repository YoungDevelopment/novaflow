import { z } from "zod";

export const updateCustomerHardwareSchema = z.object({
  Hardware_Code: z.string().min(3, "Hardware_Code is required"),

  Customer_ID: z.string().optional(),
  Hardware_Name: z.string().optional(),
  Hardware_Description: z.string().optional(),
  Hardware_Code_Description: z.string().optional(),
  HS_Code: z.union([z.string(), z.null()]).optional(),
  Customer_Description: z.union([z.string(), z.null()]).optional(),
});

export type UpdateCustomerHardwareInput = z.infer<
  typeof updateCustomerHardwareSchema
>;
