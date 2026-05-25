/**
 * Zod Validation Schema for Customer_Product_Code API
 */
import { z } from "zod";

export const createCustomerProductSchema = z.object({
  Customer_ID: z.string().trim().min(1, "Customer_ID is required"),
  Material: z.string().trim().min(1, "Material is required"),
  Width: z.number().min(1, "Width must be a positive number"),
  Adhesive_Type: z.string().trim().min(1, "Adhesive_Type is required"),
  Paper_GSM: z.number().min(1, "Paper_GSM must be a positive number"),
  Product_Description: z
    .string()
    .trim()
    .min(1, "Product_Description is required"),
  HS_Code: z.string().optional().nullable(),
  Customer_Description: z.string().optional().nullable(),
});

export type CreateCustomerProductInput = z.infer<
  typeof createCustomerProductSchema
>;
