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
import { Hardware } from "../interface";
import { useDeleteHardwareMutation } from "@/store/endpoints/vendorHardware";

interface DeleteHardwareFormProps {
  hardware: Hardware | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteHardwareForm({
  hardware,
  isOpen,
  onClose,
}: DeleteHardwareFormProps) {
  const [deleteHardware, { isLoading }] = useDeleteHardwareMutation();

  const handleDelete = async () => {
    if (!hardware) {
      return;
    }

    try {
      await deleteHardware({ Hardware_Code: hardware.Hardware_Code }).unwrap();

      toast.success(
        `Hardware "${hardware.Hardware_Name}" has been deleted successfully`
      );

      onClose();
    } catch (error: any) {
      console.error("Error deleting hardware:", error);

      // Handle different error types
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete hardware. Please try again.";

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
            Delete Hardware
          </DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="text-sm text-muted-foreground pb-2">
            Are you sure you want to delete this hardware? This action cannot be
            undone.
          </div>

          {hardware && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="font-medium text-sm text-destructive">
                Hardware Details:
              </div>
              <div className="text-sm space-y-2">
                <div className="border-b border-muted pb-2">
                  <span className="font-medium">Hardware Code:</span>{" "}
                  <span className="font-mono text-xs">
                    {hardware.Hardware_Code}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Hardware Name:</span>{" "}
                  {hardware.Hardware_Name}
                </div>
                <div>
                  <span className="font-medium">Code Description:</span>{" "}
                  <span className="text-muted-foreground">
                    {hardware.Hardware_Code_Description}
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
              {isLoading ? "Deleting..." : "Delete Hardware"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
