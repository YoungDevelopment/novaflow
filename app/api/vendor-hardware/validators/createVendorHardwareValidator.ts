import { z } from "zod";

export const createVendorHardwareSchema = z.object({
  Vendor_ID: z.string().min(1, "Vendor_ID is required"),
  Hardware_Name: z.string().min(1, "Hardware_Name is required"),
  Hardware_Description: z.string().min(1, "Hardware_Description is required"),
  Hardware_Code_Description: z
    .string()
    .min(1, "Hardware_Code_Description is required"),
});

export type CreateVendorHardwareInput = z.infer<
  typeof createVendorHardwareSchema
>;
