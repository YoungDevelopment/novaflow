"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useSyncToInventoryMutation } from "@/store/endpoints/orderInventory";
import { useFetchOrderItemsQuery } from "@/store";

interface SyncToInventoryDialogProps {
  orderId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function SyncToInventoryDialog({
  orderId,
  isOpen,
  onClose,
  onSuccess,
}: SyncToInventoryDialogProps) {
  const [syncToInventory, { isLoading }] = useSyncToInventoryMutation();

  // Fetch order items to get count of received items
  const { data: orderItemsData, isLoading: isLoadingItems } =
    useFetchOrderItemsQuery(
      { order_id: orderId, limit: 1000 },
      { skip: !orderId || !isOpen }
    );

  // Count received items (movement = 'Y')
  const receivedItems =
    orderItemsData?.data?.filter((item) => item.movement === "Y") || [];
  const receivedCount = receivedItems.length;

  const handleSync = async () => {
    if (!orderId) {
      return;
    }

    try {
      const result = await syncToInventory({ order_id: orderId }).unwrap();

      toast.success(
        `Inventory sync completed: ${result.created_count} created, ${result.updated_count} updated`
      );

      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Error syncing to inventory:", error);

      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        "Failed to sync items to inventory. Please try again.";

      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md p-0 sm:p-0">
        <DialogHeader className="px-4 py-4 sm:px-6 border-b border-muted">
          <DialogTitle>Sync to Inventory</DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="text-sm text-muted-foreground pb-2">
            This will sync all received order items to the inventory table.
            Existing inventory records will be updated, and new records will be
            created.
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="font-medium text-sm">Sync Details:</div>
            <div className="text-sm space-y-2">
              <div className="border-b border-muted pb-2">
                <span className="font-medium">Order ID:</span>{" "}
                <span className="font-mono text-xs">{orderId}</span>
              </div>
              <div>
                <span className="font-medium">Items to sync:</span>{" "}
                {isLoadingItems ? (
                  <span className="text-muted-foreground">Loading...</span>
                ) : (
                  <span>
                    {receivedCount} received item{receivedCount !== 1 ? "s" : ""}
                  </span>
                )}
              </div>
              {receivedCount === 0 && !isLoadingItems && (
                <div className="text-amber-600 text-xs">
                  No received items found. Mark items as received to sync them.
                </div>
              )}
            </div>
          </div>

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
              onClick={handleSync}
              className="w-full md:w-auto"
              disabled={isLoading || isLoadingItems || receivedCount === 0}
            >
              {isLoading ? "Syncing..." : "Sync to Inventory"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
