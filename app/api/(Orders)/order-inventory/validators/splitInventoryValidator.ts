/**
 * Validators for Inventory Split endpoints
 *
 * Uses zod for validation & parsing.
 *
 * Business rules:
 *  - inventory_id: required for eligibility check
 *  - product_code: required for fetching split options
 *  - remaining_width: required, must be positive number
 *  - is_first_split: optional boolean
 *  - requested_sqm: required, must be positive number
 *  - splits: required array of product codes
 */
import { z } from "zod";

// Schema for checking split eligibility
// Either inventory_id OR (barcode_tag and product_code) must be provided
export const checkSplitEligibilitySchema = z
  .object({
    inventory_id: z
      .string()
      .min(1, "inventory_id cannot be blank if provided")
      .optional(),
    barcode_tag: z.string().optional(),
    product_code: z.string().optional(),
  })
  .refine(
    (data) =>
      data.inventory_id ||
      (data.barcode_tag && data.product_code),
    {
      message:
        "Either inventory_id or (barcode_tag and product_code) must be provided",
      path: ["inventory_id"],
    }
  );

export type CheckSplitEligibilityInput = z.infer<
  typeof checkSplitEligibilitySchema
>;

// Schema for fetching split options
export const fetchSplitOptionsSchema = z.object({
  product_code: z.string().min(1, "product_code is required and cannot be blank"),
  remaining_width: z
    .number()
    .positive("remaining_width must be a positive number")
    .int("remaining_width must be an integer"),
  is_first_split: z.boolean().optional().default(false),
});

export type FetchSplitOptionsInput = z.infer<typeof fetchSplitOptionsSchema>;

// Schema for submitting split
export const submitSplitSchema = z.object({
  inventory_id: z.string().min(1, "inventory_id is required and cannot be blank"),
  requested_sqm: z
    .number()
    .positive("requested_sqm must be a positive number")
    .min(0.01, "requested_sqm must be greater than 0"),
  splits: z
    .array(
      z.object({
        product_code: z
          .string()
          .min(1, "product_code is required and cannot be blank"),
      })
    )
    .min(1, "At least one split product code is required"),
});

export type SubmitSplitInput = z.infer<typeof submitSplitSchema>;
