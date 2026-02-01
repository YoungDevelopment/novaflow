// /app/api/vendor-product/validators/updateVendorProductValidator.ts
import { z } from "zod";

export const updateVendorProductSchema = z
  .object({
    Product_Code: z
      .string({ message: "Product_Code is required" })
      .min(1, "Product_Code cannot be empty"),

    Vendor_ID: z.string().min(1, "Vendor_ID cannot be empty").optional(),

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
  })
  .refine((data) => Object.keys(data).some((key) => key !== "Product_Code"), {
    message: "At least one field must be provided to update",
    path: ["_global"],
  });

export type UpdateVendorProductInput = z.infer<
  typeof updateVendorProductSchema
>;
