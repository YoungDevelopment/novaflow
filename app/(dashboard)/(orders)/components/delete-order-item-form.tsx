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
import type { OrderItem } from "@/store/endpoints/orderItems/type";
import { useDeleteOrderItemMutation } from "@/store";

interface DeleteOrderItemFormProps {
  orderItem: OrderItem | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteOrderItemForm({
  orderItem,
  isOpen,
  onClose,
}: DeleteOrderItemFormProps) {
  const [deleteOrderItem, { isLoading }] = useDeleteOrderItemMutation();

  const handleDelete = async () => {
    if (!orderItem) {
      return;
    }

    try {
      await deleteOrderItem({
        order_item_id: orderItem.order_item_id,
      }).unwrap();

      toast.success(
        `Order item "${orderItem.product_code}" has been deleted successfully`
      );

      onClose();
    } catch (error: any) {
      console.error("Error deleting order item:", error);

      // Handle different error types
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete order item. Please try again.";

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
          <DialogTitle className="text-destructive">Delete Order Item</DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="text-sm text-muted-foreground pb-2">
            Are you sure you want to delete this order item? This action cannot be
            undone.
          </div>

          {orderItem && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="font-medium text-sm text-destructive">
                Order Item Details:
              </div>
              <div className="text-sm space-y-2">
                <div className="border-b border-muted pb-2">
                  <span className="font-medium">Order Item ID:</span>{" "}
                  <span className="font-mono text-xs">
                    {orderItem.order_item_id}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Product Code:</span>{" "}
                  {orderItem.product_code}
                </div>
                <div>
                  <span className="font-medium">Item Type:</span>{" "}
                  {orderItem.item_type || "-"}
                </div>
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  <span className="text-muted-foreground">
                    {orderItem.description || "-"}
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
              {isLoading ? "Deleting..." : "Delete Order Item"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

