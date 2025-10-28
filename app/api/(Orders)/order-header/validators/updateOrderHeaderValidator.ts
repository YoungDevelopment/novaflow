/**
 * Zod Schema for Order Header Update Validation
 * - Supports partial updates using order_id as the identifier
 * - All fields except order_id are optional
 */

import { z } from "zod";

export const updateOrderHeaderSchema = z.object({
  order_id: z.string().trim().min(1, "Order ID is required"),
  user: z
    .union([z.string().trim().min(1, "User cannot be empty"), z.null()])
    .optional(),
  type: z
    .union([z.string().trim().min(1, "Type cannot be empty"), z.null()])
    .optional(),
  company: z.union([z.string(), z.null()]).optional(),
  status: z
    .union([z.string().trim().min(1, "Status cannot be empty"), z.null()])
    .optional(),
  total_due: z.number().int().min(0).optional().nullable(),
  entity_id: z
    .union([z.string().trim().min(1, "Entity ID cannot be empty"), z.null()])
    .optional(),
});

export type UpdateOrderHeaderInput = z.infer<typeof updateOrderHeaderSchema>;
