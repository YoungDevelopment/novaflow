/**
 * Zod Schema for Vendor Update Validation
 * - Supports partial updates using Vendor_ID as the identifier
 */

import { z } from "zod";

export const updateVendorSchema = z.object({
  Vendor_ID: z.string().trim().min(1, "Vendor_ID is required"),
  Vendor_Name: z.string().trim().optional(),
  Vendor_Mask_ID: z.string().trim().optional(),
  NTN_Number: z.string().optional(),
  STRN_Number: z.string().optional(),
  Address_1: z.string().optional(),
  Address_2: z.string().optional(),
  Contact_Number: z.string().optional(),
  Contact_Person: z.string().optional(),
  Email_ID: z.string().optional(),
  Website: z.string().optional(),
});

export type UpdateVendorInput = z.infer<typeof updateVendorSchema>;
