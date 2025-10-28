/**
 * Request body validator for creating an Order Header.
 *
 * Uses zod for validation & parsing.
 *
 * Usage:
 *  import { createOrderHeaderSchema } from '@/app/api/(Orders)/order-header/validators/createOrderHeaderValidator';
 *  const parsed = createOrderHeaderSchema.parse(body);
 *
 * Business rules:
 *  - user: required
 *  - type: required
 *  - status: required
 *  - entity_id: required
 *  - company: optional
 *  - total_due: optional (defaults to 0)
 */
import { z } from "zod";

export const createOrderHeaderSchema = z.object({
  user: z.string().min(1, "User is required and cannot be blank"),
  type: z.string().min(1, "Type is required and cannot be blank"),
  status: z.string().min(1, "Status is required and cannot be blank"),
  entity_id: z.string().min(1, "Entity ID is required and cannot be blank"),
  company: z.string().optional().nullable(),
  total_due: z.number().int().min(0).optional().default(0),
});

export type CreateOrderHeaderInput = z.infer<typeof createOrderHeaderSchema>;
