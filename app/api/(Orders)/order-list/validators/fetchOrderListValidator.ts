/**
 * Request parameter validator for fetching a list of Orders.
 *
 * Uses zod for validation & parsing.
 *
 * Usage:
 *  import { fetchOrderListSchema } from '@/app/api/(Orders)/order-list/validators/fetchOrderListValidator';
 *  const parsed = fetchOrderListSchema.parse({ type, page, limit, entity_id, status });
 *
 * Business rules:
 *  - type: required and cannot be blank
 *  - page: must be positive integer (default 1)
 *  - limit: must be positive integer, max 100 (default 10)
 *  - entity_id: optional search filter (LIKE matching)
 *  - status: optional comma-separated list of statuses (e.g., "Active,Completed,Pending")
 *  - created_date: optional date filter for exact date match (format: YYYY-MM-DD)
 */

import { z } from "zod";

export const fetchOrderListSchema = z.object({
  type: z.string().min(1, "Type is required and cannot be blank"),
  page: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return 1;
      const num = parseInt(val, 10);
      return Number.isFinite(num) && num > 0 ? num : 1;
    }),
  limit: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return 10;
      const num = parseInt(val, 10);
      const parsed = Number.isFinite(num) && num > 0 ? num : 10;
      return Math.min(parsed, 100); // Max 100
    }),
  entity_id: z.string().nullable().optional(),
  status: z
    .string()
    .nullable()
    .optional()
    .transform((val) => {
      if (!val) return [];
      // Split by comma and trim each status
      return val
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);
    }),
  created_date: z.string().nullable().optional(),
});

export type FetchOrderListInput = z.infer<typeof fetchOrderListSchema>;
