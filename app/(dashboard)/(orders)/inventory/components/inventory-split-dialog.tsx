"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Plus } from "lucide-react";
import { SplitRow } from "./split-row";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { OrderInventory } from "@/store/endpoints/orderInventory/type";
import {
  useCheckSplitEligibilityQuery,
  useFetchSplitOptionsQuery,
  useSubmitSplitMutation,
} from "@/store/endpoints/orderInventory";
import type { SplitOption } from "@/store/endpoints/orderInventory/type";

interface InventorySplitDialogProps {
  inventory: OrderInventory | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface SplitRow {
  productCode: string | null;
  width: number;
  productDescription: string;
}

export function InventorySplitDialog({
  inventory,
  isOpen,
  onClose,
  onSuccess,
}: InventorySplitDialogProps) {
  const [requestedSqm, setRequestedSqm] = useState<string>("");
  const [splitRows, setSplitRows] = useState<SplitRow[]>([]);
  const [originalWidth, setOriginalWidth] = useState<number>(0);
  const [originalProductCode, setOriginalProductCode] = useState<string>("");
  const [availableSqm, setAvailableSqm] = useState<number>(0);
  const [isFormEnabled, setIsFormEnabled] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [inventoryIdForSplit, setInventoryIdForSplit] = useState<string>("");

  // Fetch eligibility when dialog opens
  // Use inventory_id if available, otherwise use barcode_tag + product_code
  const eligibilityParams = React.useMemo(() => {
    if (!inventory) return null;
    if (inventory.inventory_id) {
      return { inventory_id: inventory.inventory_id };
    }
    if (inventory.barcode_tag && inventory.product_code) {
      return {
        barcode_tag: inventory.barcode_tag,
        product_code: inventory.product_code,
      };
    }
    return null;
  }, [inventory]);

  const {
    data: eligibilityData,
    isLoading: isLoadingEligibility,
    isError: isEligibilityError,
  } = useCheckSplitEligibilityQuery(eligibilityParams || {}, {
    skip: !isOpen || !eligibilityParams,
  });

  // Calculate remaining width after all selected rows
  const totalRemainingWidth = useMemo(() => {
    const selectedWidth = splitRows.reduce(
      (sum, row) => sum + (row.width || 0),
      0
    );
    return originalWidth - selectedWidth;
  }, [splitRows, originalWidth]);

  // Calculate previous rows' total width for a given row index
  const getPreviousRowsWidth = (rowIndex: number) => {
    return splitRows
      .slice(0, rowIndex)
      .reduce((sum, row) => sum + row.width, 0);
  };

  const [submitSplit, { isLoading: isSubmitting }] = useSubmitSplitMutation();

  // Initialize form when eligibility data is loaded
  useEffect(() => {
    if (eligibilityData && isOpen) {
      if (!eligibilityData.eligible) {
        setErrors(["This inventory item is not eligible for splitting (SQM must be greater than 1)"]);
        setIsFormEnabled(false);
        return;
      }

      setOriginalWidth(eligibilityData.original_width);
      setOriginalProductCode(eligibilityData.product_code);
      setAvailableSqm(eligibilityData.available_sqm);
      setInventoryIdForSplit(eligibilityData.inventory_id || inventory?.inventory_id || "");
      setErrors([]);
      setIsFormEnabled(true);
      setRequestedSqm("");
      setSplitRows([]);
    }
  }, [eligibilityData, isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setRequestedSqm("");
      setSplitRows([]);
      setOriginalWidth(0);
      setOriginalProductCode("");
      setAvailableSqm(0);
      setInventoryIdForSplit("");
      setIsFormEnabled(false);
      setErrors([]);
    }
  }, [isOpen]);

  // Validate SQM input
  useEffect(() => {
    if (!requestedSqm) {
      setSplitRows([]);
      return;
    }

    const sqm = Number(requestedSqm);
    if (!Number.isFinite(sqm) || sqm <= 0) {
      setSplitRows([]);
      return;
    }

    if (sqm > availableSqm) {
      setErrors([
        `Requested SQM (${sqm}) exceeds available inventory (${availableSqm})`,
      ]);
      setSplitRows([]);
      return;
    }

    setErrors([]);
    // Initialize first split row if not exists and SQM is valid
    if (splitRows.length === 0 && sqm > 0 && sqm <= availableSqm) {
      setSplitRows([{ productCode: null, width: 0, productDescription: "" }]);
    }
  }, [requestedSqm, availableSqm]);

  // Note: We'll fetch options per row in the render, so no global auto-select needed

  const handleProductSelect = (rowIndex: number, option: SplitOption) => {
    const newRows = [...splitRows];
    newRows[rowIndex] = {
      productCode: option.product_code,
      width: option.width,
      productDescription: option.product_description,
    };

    setSplitRows(newRows);
  };

  const handleRemoveRow = (rowIndex: number) => {
    const newRows = splitRows.filter((_, idx) => idx !== rowIndex);
    setSplitRows(newRows);
  };

  const handleAddSplit = () => {
    const hasIncompleteRow = splitRows.some((row) => !row.productCode);
    if (hasIncompleteRow) {
      toast.error("Select a product code before adding another split.");
      return;
    }

    if (totalRemainingWidth > 0) {
      setSplitRows([
        ...splitRows,
        { productCode: null, width: 0, productDescription: "" },
      ]);
    }
  };

  const canCompleteSplit = useMemo(() => {
    if (!requestedSqm || Number(requestedSqm) <= 0) return false;
    if (Number(requestedSqm) > availableSqm) return false;
    if (splitRows.length === 0) return false;
    if (splitRows.some((row) => !row.productCode)) return false;

    const selectedWidth = splitRows.reduce(
      (sum, row) => sum + row.width,
      0
    );
    return selectedWidth === originalWidth;
  }, [requestedSqm, availableSqm, splitRows, originalWidth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Use stored inventory_id from eligibility check
    const inventoryIdToUse = inventoryIdForSplit || inventory?.inventory_id;

    if (!inventoryIdToUse) {
      toast.error("No inventory item selected");
      return;
    }

    if (!canCompleteSplit) {
      toast.error("Please complete all split selections");
      return;
    }

    try {
      await submitSplit({
        inventory_id: inventoryIdToUse,
        requested_sqm: Number(requestedSqm),
        splits: splitRows.map((row) => ({
          product_code: row.productCode!,
        })),
      }).unwrap();

      toast.success("Inventory split completed successfully");
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error("Split inventory error:", error);
      toast.error(
        error?.data?.message || "Failed to split inventory. Please try again."
      );
    }
  };

  if (!inventory) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Split Inventory</DialogTitle>
          <DialogDescription>
            Split this paper roll into multiple narrower rolls. All resulting
            widths must match existing product codes with the same material
            attributes.
          </DialogDescription>
        </DialogHeader>

        {isLoadingEligibility ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <span>Checking eligibility...</span>
          </div>
        ) : isEligibilityError ? (
          <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            Failed to check eligibility. Please try again.
          </div>
        ) : !isFormEnabled ? (
          <div className="p-4 bg-muted rounded-md">
            {errors.length > 0 ? (
              <div className="space-y-1">
                {errors.map((error, idx) => (
                  <p key={idx} className="text-sm text-destructive">
                    {error}
                  </p>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                This inventory item is not eligible for splitting.
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Product Info */}
            <div className="space-y-2">
              <Label>Product Description</Label>
              <p className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-md">
                {inventory.description || "N/A"}
              </p>
            </div>

            {/* Available SQM */}
            <div className="space-y-2">
              <Label>Available SQM</Label>
              <p className="text-sm font-medium bg-muted px-3 py-2 rounded-md">
                {availableSqm}
              </p>
            </div>

            {/* Original Width */}
            <div className="space-y-2">
              <Label>Original Width</Label>
              <p className="text-sm font-medium bg-muted px-3 py-2 rounded-md">
                {originalWidth}
              </p>
            </div>

            {/* SQM Input */}
            <div className="space-y-2">
              <Label htmlFor="requested-sqm">
                How many SQM do you want to split?{" "}
                <span className="text-destructive">*</span>
              </Label>
              <Input
                id="requested-sqm"
                type="number"
                step="0.01"
                min="0.01"
                max={availableSqm}
                placeholder="Enter SQM to split"
                value={requestedSqm}
                onChange={(e) => setRequestedSqm(e.target.value)}
                disabled={!isFormEnabled}
                required
              />
              {errors.length > 0 && (
                <div className="space-y-1">
                  {errors.map((error, idx) => (
                    <p key={idx} className="text-xs text-destructive">
                      {error}
                    </p>
                  ))}
                </div>
              )}
            </div>

            {/* Dynamic Split Rows */}
            {requestedSqm &&
              Number(requestedSqm) > 0 &&
              Number(requestedSqm) <= availableSqm && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Select Product Codes for Split</Label>
                    {totalRemainingWidth > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleAddSplit}
                        disabled={splitRows.some((row) => !row.productCode)}
                        className="flex items-center gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Add Split
                      </Button>
                    )}
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto border rounded-md p-4">
                    {splitRows.map((row, idx) => {
                      const previousRowsWidth = getPreviousRowsWidth(idx);
                      return (
                        <SplitRow
                          key={idx}
                          rowIndex={idx}
                          productCode={row.productCode}
                          width={row.width}
                          productDescription={row.productDescription}
                          originalProductCode={originalProductCode}
                          originalWidth={originalWidth}
                          previousRowsWidth={previousRowsWidth}
                          isFormEnabled={isFormEnabled}
                          isOpen={isOpen}
                          onSelect={(option) => handleProductSelect(idx, option)}
                          onRemove={
                            splitRows.length > 1
                              ? () => handleRemoveRow(idx)
                              : undefined
                          }
                        />
                      );
                    })}
                  </div>

                  {/* Total Remaining Width Indicator */}
                  {splitRows.length > 0 && (
                    <div className="p-3 bg-muted rounded-md">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Remaining Width:
                        </span>
                        <span
                          className={`font-semibold ${
                            totalRemainingWidth === 0
                              ? "text-green-600"
                              : totalRemainingWidth < 0
                              ? "text-destructive"
                              : ""
                          }`}
                        >
                          {totalRemainingWidth}
                        </span>
                      </div>
                      {totalRemainingWidth < 0 && (
                        <p className="text-xs text-destructive mt-1">
                          Selected widths exceed original width
                        </p>
                      )}
                      {totalRemainingWidth === 0 && (
                        <p className="text-xs text-green-600 mt-1">
                          All width allocated - ready to complete split
                        </p>
                      )}
                    </div>
                  )}
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
              <Button
                type="submit"
                disabled={!canCompleteSplit || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Splitting...
                  </>
                ) : (
                  "Complete Split"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
