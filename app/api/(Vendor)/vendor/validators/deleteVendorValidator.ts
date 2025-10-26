// /app/api/vendor/validators/deleteVendorValidator.ts

import { z } from "zod";

export const deleteVendorSchema = z.object({
  Vendor_ID: z
    .string()
    .refine((value) => value.trim().length > 0, {
      message: "Vendor_ID is required",
    })
    .trim()
    .min(1, "Vendor_ID is required"),
});

export type DeleteVendorInput = z.infer<typeof deleteVendorSchema>;
