import { z } from "zod";

export const createOrderTransactionSchema = z.object({
  Order_ID: z.string().min(1, "Order_ID is required"),
  Transaction_Date: z.string().optional(),
  Type: z.string().optional(),
  Order_Payment_Type: z.string().optional(),
  Payment_Method: z.string().optional(),
  Actual_Amount: z
    .number()
    .min(0, "Actual_Amount is required and must be non-negative"),
  Decalred_Amount: z.number().min(0).optional(),
  Notes: z.string().optional(),
});

export type CreateOrderTransactionInput = z.infer<
  typeof createOrderTransactionSchema
>;
