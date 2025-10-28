/**
 * Request parameter validator for fetching an Order Header.
 *
 * Uses zod for validation & parsing.
 *
 * Usage:
 *  import { fetchOrderHeaderSchema } from '@/app/api/(Orders)/order-header/validators/fetchOrderHeaderValidator';
 *  const parsed = fetchOrderHeaderSchema.parse({ order_id });
 *
 * Business rules:
 *  - order_id: required and cannot be blank
 */

import { z } from "zod";

export const fetchOrderHeaderSchema = z.object({
  order_id: z.string().min(1, "Order ID is required and cannot be blank"),
});

export type FetchOrderHeaderInput = z.infer<typeof fetchOrderHeaderSchema>;
