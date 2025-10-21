// app/api/vendor/validators/createVendorValidator.ts
/**
 * Request body validator for creating a Vendor.
 *
 * Uses zod for validation & parsing.
 *
 * Usage:
 *  import { createVendorSchema } from '@/app/api/vendor/validators/createVendorValidator';
 *  const parsed = createVendorSchema.parse(body);
 *
 * Business rules:
 *  - Vendor_Name: required, 1..255 chars
 *  - Vendor_Mask_ID: required, 1..64 chars (alphanumeric/underscore/hyphen)
 *  - Optional fields: basic format validation (email, url, contact number) but permissive
 */
// /app/api/vendor/validators/createVendorValidator.ts
import { z } from "zod";

export const createVendorSchema = z.object({
  Vendor_Name: z.string().min(1, "Vendor_Name is required"),
  Vendor_Mask_ID: z.string().min(1, "Vendor_Mask_ID is required"),
  NTN_Number: z.string().optional().nullable(),
  STRN_Number: z.string().optional().nullable(),
  Address_1: z.string().optional().nullable(),
  Address_2: z.string().optional().nullable(),
  Contact_Number: z.string().optional().nullable(),
  Contact_Person: z.string().optional().nullable(),
  Email_ID: z.string().email().optional().nullable(),
  Website: z.string().url().optional().nullable(),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
