import { z } from "zod";

export const deleteOrderTransactionSchema = z.object({
  Order_Transcation_ID: z.string().min(1, "Order_Transcation_ID is required"),
});

export type DeleteOrderTransactionInput = z.infer<
  typeof deleteOrderTransactionSchema
>;
