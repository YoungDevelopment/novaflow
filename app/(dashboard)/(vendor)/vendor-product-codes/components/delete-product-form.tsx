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
import { Product } from "../interface";
import { useDeleteProductMutation } from "@/store/endpoints/vendorProducts";

interface DeleteProductFormProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteProductForm({
  product,
  isOpen,
  onClose,
}: DeleteProductFormProps) {
  const [deleteProduct, { isLoading }] = useDeleteProductMutation();

  const handleDelete = async () => {
    if (!product) {
      return;
    }

    try {
      await deleteProduct({ Product_Code: product.Product_Code }).unwrap();

      toast.success(
        `Product "${product.Product_Code}" has been deleted successfully`
      );

      onClose();
    } catch (error: any) {
      console.error("Error deleting product:", error);

      // Handle different error types
      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        "Failed to delete product. Please try again.";

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
          <DialogTitle className="text-destructive">Delete Product</DialogTitle>
        </DialogHeader>

        <div className="px-4 sm:px-6">
          <div className="text-sm text-muted-foreground pb-2">
            Are you sure you want to delete this product? This action cannot be
            undone.
          </div>

          {product && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="font-medium text-sm text-destructive">
                Product Details:
              </div>
              <div className="text-sm space-y-2">
                <div className="border-b border-muted pb-2">
                  <span className="font-medium">Product Code:</span>{" "}
                  <span className="font-mono text-xs">
                    {product.Product_Code}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Material:</span>{" "}
                  {product.Material}
                </div>
                <div>
                  <span className="font-medium">Description:</span>{" "}
                  <span className="text-muted-foreground">
                    {product.Product_Description}
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
              {isLoading ? "Deleting..." : "Delete Product"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
