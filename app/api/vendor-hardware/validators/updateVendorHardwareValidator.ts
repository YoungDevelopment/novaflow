import { z } from "zod";

export const updateVendorHardwareSchema = z.object({
  Hardware_Code: z.string().min(3, "Hardware_Code is required"),

  Vendor_ID: z.string().optional(),
  Hardware_Name: z.string().optional(),
  Hardware_Description: z.string().optional(),
  Hardware_Code_Description: z.string().optional(),
});

export type UpdateVendorHardwareInput = z.infer<
  typeof updateVendorHardwareSchema
>;
