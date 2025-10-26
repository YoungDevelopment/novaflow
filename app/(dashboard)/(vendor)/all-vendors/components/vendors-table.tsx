"use client";

import * as React from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import {
  DataTable,
  createColumn,
  createAction,
} from "@/components/ui/data-table";
import { Vendor } from "@/store/endpoints/vendor/type";
import { useFetchVendorsQuery } from "@/store/endpoints/vendor";
import { Button } from "@/components/ui/button";
import { VendorTableProps } from "../interface/vendor.interface";
import { CompactLoader } from "@/app/(dashboard)/components";

export function VendorsTable({ onEdit, onDelete, onCreate }: VendorTableProps) {
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

  const {
    data,
    isLoading: isLoadingData,
    isError,
  } = useFetchVendorsQuery({
    page: currentPage,
    limit: recordsPerPage,
    search: debouncedSearchTerm || undefined,
  });

  const vendors = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    search: "",
  };
  const isLoading = isLoadingData || isError;

  const handleCreateVendor = () => {
    if (onCreate) {
      onCreate();
    }
  };

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const columns = [
    createColumn<Vendor>("Vendor_Name", "Vendor Name", {
      cell: (value) => <span className="font-medium">{value}</span>,
      align: "center",
    }),
    createColumn<Vendor>("Vendor_Mask_ID", "Vendor Mask ID", {
      cell: (value) => (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {value}
        </span>
      ),
      align: "center",
    }),
    createColumn<Vendor>("Contact_Person", "Contact Person", {
      cell: (value) =>
        value ? (
          <span>{value}</span>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
      align: "center",
    }),
    createColumn<Vendor>("Contact_Number", "Contact Number", {
      cell: (value) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
      align: "center",
    }),
  ];

  const actions = [];
  if (onEdit) {
    actions.push(
      createAction<Vendor>("Edit", onEdit, {
        icon: <Edit className="mr-2 h-4 w-4" />,
      })
    );
  }
  if (onDelete) {
    actions.push(
      createAction<Vendor>("Delete", (vendor) => onDelete(vendor), {
        icon: <Trash2 className="mr-2 h-4 w-4" />,
        className: "text-red-600",
      })
    );
  }
  const footerActions = (
    <Button className="gap-2" onClick={handleCreateVendor}>
      <Plus className="h-4 w-4" />
      Create New Vendor
    </Button>
  );
  const config = {
    columns,
    actions: actions.length > 0 ? actions : undefined,
    searchable: true,
    searchPlaceholder: "Search vendors...",
    backendSearch: true,
    onSearchChange: handleSearchChange,
    pagination: {
      enabled: true,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: isLoading,
    emptyMessage: "No vendors found.",
    noResultsMessage: "No vendors found matching your search.",
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
          data={vendors}
          config={config}
          searchValue={searchTerm}
          externalPagination={externalPagination}
          footerActions={footerActions}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">Loading vendors...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
