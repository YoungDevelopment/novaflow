"use client";

import React, { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { OrderInventory } from "@/store/endpoints/orderInventory/type";

interface InventorySplitDialogProps {
  inventory: OrderInventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InventorySplitDialog({
  inventory,
  isOpen,
  onClose,
  onSuccess,
}: InventorySplitDialogProps) {
  const [splitQuantity, setSplitQuantity] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const totalQuantity = inventory
    ? Number(inventory.total_unit_quantity ?? inventory.unit_quantity ?? 0)
    : 0;

  useEffect(() => {
    if (isOpen && inventory) {
      setSplitQuantity("");
    }
  }, [isOpen, inventory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inventory) {
      toast.error("No inventory item selected");
      return;
    }

    const splitQty = Number(splitQuantity);
    if (!Number.isFinite(splitQty) || splitQty <= 0) {
      toast.error("Split quantity must be a positive number");
      return;
    }

    if (splitQty >= totalQuantity) {
      toast.error(
        `Split quantity must be less than total quantity (${totalQuantity})`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO: Implement split API call when backend endpoint is available
      // For now, this is a placeholder that shows the structure
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API call

      toast.success("Inventory split functionality will be implemented soon");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Split inventory error:", error);
      toast.error(error?.data?.message || "Failed to split inventory");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!inventory) return null;

  const remainingQuantity = totalQuantity - Number(splitQuantity || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Split Inventory</DialogTitle>
          <DialogDescription>
            Split this inventory item into separate entries. The original item
            will be reduced by the split quantity.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Product/Hardware Description</Label>
            <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
              {inventory.description || "N/A"}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-quantity">Total Quantity</Label>
            <p className="text-sm font-medium bg-muted px-3 py-2 rounded-md">
              {totalQuantity}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="split-quantity">
              Split Quantity <span className="text-destructive">*</span>
            </Label>
            <Input
              id="split-quantity"
              type="number"
              min="1"
              max={totalQuantity - 1}
              placeholder="Enter quantity to split"
              value={splitQuantity}
              onChange={(e) => setSplitQuantity(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Enter the quantity to split from this inventory item
            </p>
          </div>

          {splitQuantity && Number(splitQuantity) > 0 && (
            <div className="space-y-2 p-3 bg-muted rounded-md">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Original Quantity:</span>
                <span className="font-medium">{totalQuantity}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Split Quantity:</span>
                <span className="font-medium">{splitQuantity}</span>
              </div>
              <div className="flex justify-between text-sm border-t pt-2">
                <span className="font-semibold">Remaining Quantity:</span>
                <span className="font-semibold">{remainingQuantity}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Splitting...
                </>
              ) : (
                "Split Inventory"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
