import { z } from "zod";

export const updateOrderTransactionSchema = z.object({
  Order_Transcation_ID: z.string().min(1, "Order_Transcation_ID is required"),
  Order_ID: z.string().min(1).optional(),
  Transaction_Date: z.string().optional(),
  Type: z.string().optional(),
  Order_Payment_Type: z.string().optional(),
  Payment_Method: z.string().optional(),
  Actual_Amount: z.number().min(0).optional(),
  Decalred_Amount: z.number().min(0).optional(),
  Notes: z.string().optional(),
});

export type UpdateOrderTransactionInput = z.infer<
  typeof updateOrderTransactionSchema
>;
