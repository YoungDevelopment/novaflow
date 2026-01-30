"use client";

import * as React from "react";
import { Info, Scissors, MoreHorizontal } from "lucide-react";
import {
  DataTable,
  createColumn,
  createAction,
} from "@/components/ui/data-table";
import { OrderInventory } from "@/store/endpoints/orderInventory/type";
import { useFetchOrderInventoryQuery } from "@/store/endpoints/orderInventory";
import { CompactLoader } from "@/app/(dashboard)/components";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface InventoryTableProps {
  mode: "all" | "available";
  onInfoClick: (inventory: OrderInventory) => void;
  onSplitClick: (inventory: OrderInventory) => void;
}

export function InventoryTable({
  mode,
  onInfoClick,
  onSplitClick,
}: InventoryTableProps) {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    React.useState<string>("");

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset to page 1 when mode or search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [mode, debouncedSearchTerm]);

  const {
    data,
    isLoading: isLoadingData,
    isError,
  } = useFetchOrderInventoryQuery({
    page: currentPage,
    limit: recordsPerPage,
    mode: mode === "available" ? "available" : undefined, // Don't send "all", let API default to all
    search: debouncedSearchTerm || undefined,
  });

  const inventoryItems = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    orderFiltered: "All Orders",
  };
  const isLoading = isLoadingData || isError;

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const formatCurrency = (value: any): string => {
    if (value === null || value === undefined || value === "") return "N/A";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "N/A";
    return `$${num.toFixed(2)}`;
  };

  const formatQuantity = (value: any): string => {
    if (value === null || value === undefined || value === "") return "0";
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "0";
    return num.toString();
  };

  const columns = [
    createColumn<OrderInventory>("description", "Product/Hardware Description", {
      cell: (value) => (
        <span className="font-medium">{value || "N/A"}</span>
      ),
      align: "left",
    }),
    createColumn<OrderInventory>("total_unit_quantity", "Total Unit Quantity", {
      cell: (value, row) => {
        const qty = formatQuantity(value ?? row.unit_quantity);
        return <span className="font-mono">{qty}</span>;
      },
      align: "center",
    }),
    createColumn<OrderInventory>(
      "actaul_price_per_unit",
      "Actual Price Per Unit",
      {
        cell: (value, row) => {
          const price = formatCurrency(
            value ?? row.actual_price_per_unit
          );
          return <span className="font-medium">{price}</span>;
        },
        align: "center",
      }
    ),
  ];

  // Create custom actions cell that conditionally shows Split only for products with unit_quantity > 1
  const actionsCell = React.useCallback(
    (value: any, row: OrderInventory) => {
      const isProduct = row.type?.toLowerCase() === "product";
      const unitQuantity = Number(
        row.total_unit_quantity ?? row.unit_quantity ?? 0
      );
      const isEligibleForSplit = isProduct && unitQuantity > 1;

      const availableActions = [
        {
          label: "Info",
          icon: <Info className="mr-2 h-4 w-4" />,
          onClick: () => onInfoClick(row),
        },
        ...(isEligibleForSplit
          ? [
              {
                label: "Split",
                icon: <Scissors className="mr-2 h-4 w-4" />,
                onClick: () => onSplitClick(row),
              },
            ]
          : []),
      ];

      return (
        <div className="flex justify-center">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {availableActions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                  }}
                >
                  {action.icon}
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
    [onInfoClick, onSplitClick]
  );

  const actions = [
    createAction<OrderInventory>("Options", () => {}, {
      cell: actionsCell,
      key: "options",
    }),
  ];

  const config = {
    columns,
    actions,
    searchable: true,
    searchPlaceholder: "Search inventory...",
    backendSearch: true,
    onSearchChange: handleSearchChange,
    pagination: {
      enabled: true,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: isLoading,
    emptyMessage: "No inventory found.",
    noResultsMessage: "No inventory found matching your search.",
  };

  const externalPagination = {
    currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.total,
    pageSize: recordsPerPage,
    onPageChange: setCurrentPage,
    onPageSizeChange: handleRecordsPerPageChange,
  };

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <DataTable
          data={inventoryItems}
          config={config}
          searchValue={searchTerm}
          externalPagination={externalPagination}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">Loading inventory...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
