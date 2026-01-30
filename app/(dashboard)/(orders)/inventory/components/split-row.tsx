"use client";

import React from "react";
import { Loader2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFetchSplitOptionsQuery } from "@/store/endpoints/orderInventory";
import type { SplitOption } from "@/store/endpoints/orderInventory/type";

interface SplitRowProps {
  rowIndex: number;
  productCode: string | null;
  width: number;
  productDescription: string;
  originalProductCode: string;
  originalWidth: number;
  previousRowsWidth: number;
  isFormEnabled: boolean;
  isOpen: boolean;
  onSelect: (option: SplitOption) => void;
  onRemove?: () => void;
}

export function SplitRow({
  rowIndex,
  productCode,
  width,
  productDescription,
  originalProductCode,
  originalWidth,
  previousRowsWidth,
  isFormEnabled,
  isOpen,
  onSelect,
  onRemove,
}: SplitRowProps) {
  const rowRemainingWidth = originalWidth - previousRowsWidth;
  const isFirstSplit = rowIndex === 0;

  const {
    data: splitOptionsData,
    isLoading: isLoadingOptions,
  } = useFetchSplitOptionsQuery(
    {
      product_code: originalProductCode,
      remaining_width: rowRemainingWidth,
      is_first_split: isFirstSplit,
    },
    {
      skip:
        !isOpen ||
        !originalProductCode ||
        rowRemainingWidth <= 0 ||
        !isFormEnabled,
    }
  );

  const options = splitOptionsData?.options || [];
  const selectedOption = productCode
    ? options.find((opt) => opt.product_code === productCode)
    : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label className="flex-1">
          Split {rowIndex + 1}
          {rowRemainingWidth > 0 && (
            <span className="text-muted-foreground ml-2">
              (Remaining: {rowRemainingWidth})
            </span>
          )}
        </Label>
        {onRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
          >
            Remove
          </Button>
        )}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between bg-transparent"
            disabled={isLoadingOptions || rowRemainingWidth <= 0}
          >
            {isLoadingOptions ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading options...
              </>
            ) : selectedOption ? (
              <>
                <span className="font-medium">
                  {selectedOption.product_description || selectedOption.product_code}
                </span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Width: {selectedOption.width})
                </span>
                <ChevronDown className="h-4 w-4 ml-auto" />
              </>
            ) : (
              <>
                {options.length > 0
                  ? "Select product code"
                  : "No options available"}
                <ChevronDown className="h-4 w-4" />
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        {options.length > 0 && (
          <DropdownMenuContent className="w-full max-h-[300px] overflow-y-auto">
            {options.map((option) => (
              <DropdownMenuItem
                key={option.product_code}
                onClick={() => onSelect(option)}
                className={
                  productCode === option.product_code ? "bg-accent" : ""
                }
              >
                <div className="flex flex-col">
                  <span className="font-medium">
                    {option.product_description || option.product_code}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Width: {option.width}
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        )}
      </DropdownMenu>
      {!productCode &&
        rowRemainingWidth > 0 &&
        options.length === 0 &&
        !isLoadingOptions && (
          <p className="text-xs text-destructive">
            No product codes available for remaining width ({rowRemainingWidth})
          </p>
        )}
    </div>
  );
}
