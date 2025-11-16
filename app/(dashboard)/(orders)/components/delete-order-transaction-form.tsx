"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { OrderTransaction } from "@/store/endpoints/orderTransactions/type";
import { useDeleteOrderTransactionMutation } from "@/store/endpoints/orderTransactions";

interface DeleteOrderTransactionFormProps {
  transaction: OrderTransaction | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteOrderTransactionForm({
  transaction,
  isOpen,
  onClose,
}: DeleteOrderTransactionFormProps) {
  const [deleteTransaction, { isLoading }] =
    useDeleteOrderTransactionMutation();

  const handleDelete = async () => {
    if (!transaction) {
      return;
    }

    try {
      await deleteTransaction({
        Order_Transcation_ID: transaction.Order_Transcation_ID,
      }).unwrap();

      toast.success(
        `Transaction "${transaction.Order_Transcation_ID}" has been deleted successfully`
      );

      onClose();
    } catch (error: any) {
      console.error("Error deleting transaction:", error);

      // Handle different error types
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete transaction. Please try again.";

      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 sm:p-0">
        <DialogHeader className="px-4 py-4 sm:px-6 border-b border-muted">
          <DialogTitle className="text-destructive">
            Delete Transaction
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="text-sm text-muted-foreground pb-2">
            Are you sure you want to delete this transaction? This action cannot
            be undone.
          </div>

          {transaction && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="font-medium text-sm text-destructive">
                Transaction Details:
              </div>
              <div className="text-sm space-y-2">
                <div className="border-b border-muted pb-2">
                  <span className="font-medium">Transaction ID:</span>{" "}
                  <span className="font-mono text-xs">
                    {transaction.Order_Transcation_ID}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Payment Type:</span>{" "}
                  {transaction.Order_Payment_Type || "-"}
                </div>
                <div>
                  <span className="font-medium">Payment Method:</span>{" "}
                  {transaction.Payment_Method || "-"}
                </div>
                <div>
                  <span className="font-medium">Actual Amount:</span>{" "}
                  {transaction.Actual_Amount !== null &&
                  transaction.Actual_Amount !== undefined
                    ? Number(transaction.Actual_Amount).toFixed(2)
                    : "-"}
                </div>
                <div>
                  <span className="font-medium">Notes:</span>{" "}
                  <span className="text-muted-foreground">
                    {transaction.Notes || "-"}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end pt-4 pb-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="w-full md:w-auto"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete Transaction"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

