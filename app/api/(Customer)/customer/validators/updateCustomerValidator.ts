/**
 * Zod Schema for Customer Update Validation
 * - Supports partial updates using Customer_ID as the identifier
 */

import { z } from "zod";

export const updateCustomerSchema = z.object({
  Customer_ID: z.string().trim().min(1, "Customer_ID is required"),
  Customer_Name: z
    .union([z.string().trim().min(1, "Customer_Name cannot be empty"), z.null()])
    .optional(),
  Customer_Mask_ID: z
    .union([
      z.string().trim().min(1, "Customer_Mask_ID cannot be empty"),
      z.null(),
    ])
    .optional(),
  NTN_Number: z.union([z.string(), z.null()]).optional(),
  STRN_Number: z.union([z.string(), z.null()]).optional(),
  Address_1: z.union([z.string(), z.null()]).optional(),
  Address_2: z.union([z.string(), z.null()]).optional(),
  Contact_Number: z.union([z.string(), z.null()]).optional(),
  Contact_Person: z.union([z.string(), z.null()]).optional(),
  Email_ID: z.union([z.string().email(), z.null()]).optional(),
  Website: z.union([z.string().url(), z.null()]).optional(),
  Account_Number: z.union([z.string(), z.null()]).optional(),
  IBAN_Number: z.union([z.string(), z.null()]).optional(),
  Swift_Code: z.union([z.string(), z.null()]).optional(),
  Bank_Name: z.union([z.string(), z.null()]).optional(),
  Branch_Code: z.union([z.string(), z.null()]).optional(),
  Notes: z.union([z.string(), z.null()]).optional(),
});

export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>;
