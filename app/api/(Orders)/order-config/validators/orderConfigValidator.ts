/**
 * Validators for Order Config endpoints
 *
 * Uses zod for validation & parsing.
 *
 * Business rules:
 *  - order_id: required
 *  - tax_percentage: optional (default 0.0)
 *  - committed_date: optional
 *  - entity_order: optional
 *  - gate_pass: optional
 */

import { z } from "zod";

// Schema for fetching order config by order_id
export const fetchOrderConfigSchema = z.object({
  order_id: z.string().min(1, "Order ID is required and cannot be blank"),
});

export type FetchOrderConfigInput = z.infer<typeof fetchOrderConfigSchema>;

// Schema for upserting order config
export const upsertOrderConfigSchema = z.object({
  order_id: z.string().min(1, "Order ID is required and cannot be blank"),
  tax_percentage: z.number().nonnegative().optional(),
  committed_date: z.string().optional().nullable(),
  entity_order: z.string().optional().nullable(),
  gate_pass: z.string().optional().nullable(),
});

export type UpsertOrderConfigInput = z.infer<typeof upsertOrderConfigSchema>;
