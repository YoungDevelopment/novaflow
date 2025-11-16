"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDeleteOrderChargeMutation } from "@/store";
import type { OrderCharge } from "@/store/endpoints/orderCharges/type";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DeleteOrderChargeFormProps {
  charge: OrderCharge | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteOrderChargeForm({
  charge,
  isOpen,
  onClose,
}: DeleteOrderChargeFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteCharge] = useDeleteOrderChargeMutation();

  const handleDelete = async () => {
    if (!charge) return;
    setIsSubmitting(true);
    try {
      await deleteCharge({ Order_Charges_ID: charge.Order_Charges_ID }).unwrap();
      toast.success("Order charge deleted successfully");
      onClose();
    } catch (error: any) {
      console.error("Delete order charge error:", error);
      toast.error(error?.data?.message || "Failed to delete order charge");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Order Charge</DialogTitle>
        </DialogHeader>
        <div className="py-2">
          Are you sure you want to delete{" "}
          <span className="font-medium">{charge?.Description}</span>?
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              "Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


