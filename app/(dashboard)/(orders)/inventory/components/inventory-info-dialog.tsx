"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { OrderInventory } from "@/store/endpoints/orderInventory/type";
import { Label } from "@/components/ui/label";

interface InventoryInfoDialogProps {
  inventory: OrderInventory | null;
  isOpen: boolean;
  onClose: () => void;
}

export function InventoryInfoDialog({
  inventory,
  isOpen,
  onClose,
}: InventoryInfoDialogProps) {
  if (!inventory) return null;

  const formatValue = (value: any): string => {
    if (value === null || value === undefined || value === "") return "N/A";
    if (typeof value === "number") return value.toString();
    return String(value);
  };

  const formatCurrency = (value: any): string => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "N/A";
    return `$${num.toFixed(2)}`;
  };

  const formatDate = (value: any): string => {
    if (!value) return "N/A";
    try {
      const date = new Date(value);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch {
      return formatValue(value);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inventory Details</DialogTitle>
          <DialogDescription>
            View detailed information about this inventory item
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Information */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Product/Hardware Description
                </Label>
                <p className="text-sm font-medium">{formatValue(inventory.description)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Type</Label>
                <p className="text-sm font-medium capitalize">{formatValue(inventory.type)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Product Code</Label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {formatValue(inventory.product_code)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Barcode Tag</Label>
                <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                  {formatValue(inventory.barcode_tag)}
                </p>
              </div>
            </div>
          </div>

          {/* Quantities */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Quantities
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Total Unit Quantity
                </Label>
                <p className="text-sm font-medium">
                  {formatValue(inventory.total_unit_quantity ?? inventory.unit_quantity)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Unit Quantity</Label>
                <p className="text-sm font-medium">{formatValue(inventory.unit_quantity)}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">KG Quantity</Label>
                <p className="text-sm font-medium">{formatValue(inventory.kg_quantity)}</p>
              </div>
              {inventory.item_count && (
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Item Count</Label>
                  <p className="text-sm font-medium">{formatValue(inventory.item_count)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground border-b pb-2">
              Pricing
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Actual Price Per Unit
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(
                    inventory.actaul_price_per_unit ?? inventory.actual_price_per_unit
                  )}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Declared Price Per Unit
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(inventory.declared_price_per_unit)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Actual Price Per KG
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(inventory.actual_price_per_kg)}
                </p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Declared Price Per KG
                </Label>
                <p className="text-sm font-medium">
                  {formatCurrency(inventory.declared_price_per_kg)}
                </p>
              </div>
            </div>
          </div>

          {/* Order Information */}
          {(inventory.order_id || inventory.order_transaction_type || inventory.order_payment_type) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Order Information
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inventory.order_id && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Order ID</Label>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {formatValue(inventory.order_id)}
                    </p>
                  </div>
                )}
                {inventory.order_transaction_type && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Transaction Type
                    </Label>
                    <p className="text-sm font-medium">
                      {formatValue(inventory.order_transaction_type)}
                    </p>
                  </div>
                )}
                {inventory.order_payment_type && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Payment Type</Label>
                    <p className="text-sm font-medium">
                      {formatValue(inventory.order_payment_type)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timestamps */}
          {(inventory.created_at || inventory.updated_at) && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground border-b pb-2">
                Timestamps
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {inventory.created_at && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Created At</Label>
                    <p className="text-sm">{formatDate(inventory.created_at)}</p>
                  </div>
                )}
                {inventory.updated_at && (
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Updated At</Label>
                    <p className="text-sm">{formatDate(inventory.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
