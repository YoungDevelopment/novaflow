// /app/api/customer-product/validators/updateCustomerProductValidator.ts
import { z } from "zod";

export const updateCustomerProductSchema = z
  .object({
    Product_Code: z
      .string({ message: "Product_Code is required" })
      .min(1, "Product_Code cannot be empty"),

    Customer_ID: z.string().min(1, "Customer_ID cannot be empty").optional(),

    Material: z.string().min(1, "Material cannot be empty").optional(),

    Width: z
      .number({ message: "Width must be a number" })
      .positive("Width must be positive")
      .optional(),

    Adhesive_Type: z
      .string()
      .min(1, "Adhesive_Type cannot be empty")
      .optional(),

    Paper_GSM: z
      .number({ message: "Paper_GSM must be a number" })
      .positive("Paper_GSM must be positive")
      .optional(),

    Product_Description: z
      .string()
      .min(1, "Product_Description cannot be empty")
      .optional(),

    HS_Code: z.union([z.string(), z.null()]).optional(),

    Customer_Description: z.union([z.string(), z.null()]).optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== "Product_Code"), {
    message: "At least one field must be provided to update",
    path: ["_global"],
  });

export type UpdateCustomerProductInput = z.infer<
  typeof updateCustomerProductSchema
>;
