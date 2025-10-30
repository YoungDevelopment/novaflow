import { z } from "zod";

export const fetchOrderNoteSchema = z.object({
  order_id: z.string().min(1, "Order ID is required and cannot be blank"),
});

export type FetchOrderNoteInput = z.infer<typeof fetchOrderNoteSchema>;

export const updateOrderNoteSchema = z.object({
  order_note_id: z.string().min(1, "Order Note ID is required"),
  note: z.string().nullable().optional(),
});

export type UpdateOrderNoteInput = z.infer<typeof updateOrderNoteSchema>;


