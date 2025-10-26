/**
 * Zod Validation Schema for Vendor_Product_Code API
 */
import { z } from "zod";

export const createVendorProductSchema = z.object({
  Vendor_ID: z.string().trim().min(1, "Vendor_ID is required"),
  Material: z.string().trim().min(1, "Material is required"),
  Width: z.number().min(1, "Width must be a positive number"),
  Adhesive_Type: z.string().trim().min(1, "Adhesive_Type is required"),
  Paper_GSM: z.number().min(1, "Paper_GSM must be a positive number"),
  Product_Description: z
    .string()
    .trim()
    .min(1, "Product_Description is required"),
});

export type CreateVendorProductInput = z.infer<
  typeof createVendorProductSchema
>;
