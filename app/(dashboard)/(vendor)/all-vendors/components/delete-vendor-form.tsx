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
import { Vendor } from "../interface";
import { useDeleteVendorMutation } from "@/store";

interface DeleteVendorFormProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteVendorForm({
  vendor,
  isOpen,
  onClose,
}: DeleteVendorFormProps) {
  const [deleteVendor, { isLoading }] = useDeleteVendorMutation();

  const handleDelete = async () => {
    if (!vendor) {
      return;
    }

    try {
      await deleteVendor(vendor.Vendor_ID).unwrap();

      toast.success(
        `Vendor "${vendor.Vendor_Name}" has been deleted successfully`
      );

      onClose();
    } catch (error: any) {
      console.error("Error deleting vendor:", error);

      // Handle different error types
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete vendor. Please try again.";

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
          <DialogTitle className="text-destructive">Delete Vendor</DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="text-sm text-muted-foreground pb-2">
            Are you sure you want to delete this vendor? This action cannot be
            undone.
          </div>

          {vendor && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="font-medium text-sm text-destructive">
                Vendor Details:
              </div>
              <div className="text-sm space-y-2">
                <div className="border-b border-muted pb-2">
                  <span className="font-medium">Vendor ID:</span>{" "}
                  <span className="font-mono text-xs">{vendor.Vendor_ID}</span>
                </div>
                <div>
                  <span className="font-medium">Name:</span>{" "}
                  {vendor.Vendor_Name}
                </div>
                <div>
                  <span className="font-medium">Mask ID:</span>{" "}
                  <span className="font-mono text-xs">
                    {vendor.Vendor_Mask_ID}
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
              {isLoading ? "Deleting..." : "Delete Vendor"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
