import { z } from "zod";

export const createCustomerHardwareSchema = z.object({
  Customer_ID: z.string().min(1, "Customer_ID is required"),
  Hardware_Name: z.string().min(1, "Hardware_Name is required"),
  Hardware_Description: z.string().min(1, "Hardware_Description is required"),
  Hardware_Code_Description: z
    .string()
    .min(1, "Hardware_Code_Description is required"),
  HS_Code: z.string().optional().nullable(),
  Customer_Description: z.string().optional().nullable(),
});

export type CreateCustomerHardwareInput = z.infer<
  typeof createCustomerHardwareSchema
>;
