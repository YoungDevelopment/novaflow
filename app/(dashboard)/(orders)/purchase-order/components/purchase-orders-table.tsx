"use client";

import * as React from "react";
import { X, ChevronDown, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { DataTable, createColumn } from "@/components/ui/data-table";
import { Purchase } from "@/store/endpoints/purchaseOrder/type";
import { useFetchPurchaseOrdersQuery } from "@/store/endpoints/purchaseOrder";
import { Button } from "@/components/ui/button";
import { CompactLoader } from "@/app/(dashboard)/components";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DateRangePicker } from "./date-range-picker";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { useFetchVendorNamesQuery } from "@/store/endpoints/vendorProducts";

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "Incomplete", label: "Incomplete" },
  { value: "Not Received", label: "Not Received" },
  { value: "In Progress", label: "In Progress" },
  { value: "Pending Dues", label: "Pending Dues" },
  { value: "Overdue", label: "Overdue" },
  { value: "Overpaid", label: "Overpaid" },
  { value: "Complete", label: "Complete" },
];

export function PurchaseOrdersTable() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    React.useState<string>("");
  const [selectedStatus, setSelectedStatus] = React.useState<string>("all");
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>();
  const [selectedVendor, setSelectedVendor] = React.useState<{
    id: string | null;
    name: string;
  } | null>({
    id: null,
    name: "All Vendors",
  });

  // Fetch vendors
  const { data: vendorsData, isLoading: vendorsLoading } =
    useFetchVendorNamesQuery();
  const vendors = vendorsData?.data || [];

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Build status filter array
  const statusFilter = selectedStatus === "all" ? undefined : [selectedStatus];

  // Build vendor filter - use entity_id with Vendor_ID
  const vendorFilter = selectedVendor?.id || undefined;

  // Format date range for API
  const dateRangeParams = React.useMemo(() => {
    if (dateRange?.from && dateRange?.to) {
      return {
        start_date: format(dateRange.from, "yyyy-MM-dd"),
        end_date: format(dateRange.to, "yyyy-MM-dd"),
      };
    }
    return undefined;
  }, [dateRange]);

  const { data, isFetching, isError } = useFetchPurchaseOrdersQuery({
    page: currentPage,
    limit: recordsPerPage,
    status: statusFilter,
    entity_id: vendorFilter,
    start_date: dateRangeParams?.start_date,
    end_date: dateRangeParams?.end_date,
  });

  const purchases = data?.data || [];
  const pagination = data?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  };
  const isLoading = isFetching || vendorsLoading;

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
    setCurrentPage(1);
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setCurrentPage(1);
  };

  const clearDateRange = () => {
    setDateRange(undefined);
    setCurrentPage(1);
  };

  const handleVendorChange = (vendorId: string | null) => {
    if (vendorId === null) {
      setSelectedVendor({ id: null, name: "All Vendors" });
    } else {
      const vendor = vendors?.find((v) => v.Vendor_ID === vendorId);
      if (vendor) {
        setSelectedVendor({
          id: vendor.Vendor_ID,
          name: vendor.Vendor_Name,
        });
      }
    }
    setCurrentPage(1);
  };

  const handleRowClick = (purchase: Purchase) => {
    router.push(
      `/purchase-order-form?Order_ID=${purchase.order_id}&Order_Type=Purchase`
    );
  };

  const handleCreatePurchaseOrder = () => {
    router.push("/purchase-order-form?Order_Type=Purchase");
  };

  const columns = [
    createColumn<Purchase>("order_id", "Order ID", {
      cell: (value) => (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {value}
        </span>
      ),
      align: "center",
    }),
    createColumn<Purchase>("entity_id", "Entity ID", {
      cell: (value) => <span className="font-medium">{value || "N/A"}</span>,
      align: "center",
    }),
    createColumn<Purchase>("company", "Company", {
      cell: (value) => <span>{value || "N/A"}</span>,
      align: "center",
    }),
    createColumn<Purchase>("status", "Status", {
      cell: (value) => {
        const statusColors: Record<string, string> = {
          Complete:
            "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
          "In Progress":
            "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
          Incomplete:
            "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
          "Not Received":
            "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
          "Pending Dues":
            "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
          Overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
          Overpaid:
            "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
        };
        const colorClass =
          statusColors[value as string] ||
          "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
        return (
          <span
            className={`px-2 py-1 rounded-md text-xs font-medium ${colorClass}`}
          >
            {value}
          </span>
        );
      },
      align: "center",
    }),
    createColumn<Purchase>("total_due", "Total Due", {
      cell: (value) => {
        const numValue = typeof value === "string" ? parseFloat(value) : value;
        return (
          <span className="font-medium">
            {isNaN(numValue) ? "N/A" : `$${numValue.toFixed(2)}`}
          </span>
        );
      },
      align: "center",
    }),
    createColumn<Purchase>("user", "User", {
      cell: (value) => <span>{value || "N/A"}</span>,
      align: "center",
    }),
    createColumn<Purchase>("created_at", "Created At", {
      cell: (value) => {
        if (!value)
          return <span className="text-muted-foreground/60">N/A</span>;
        try {
          const date = new Date(value);
          return (
            <span className="text-sm">
              {date.toLocaleDateString()} {date.toLocaleTimeString()}
            </span>
          );
        } catch {
          return <span className="text-muted-foreground/60">N/A</span>;
        }
      },
      align: "center",
    }),
  ];

  const config = {
    columns,
    searchable: true,
    searchPlaceholder: "Search purchase orders...",
    backendSearch: true,
    onSearchChange: handleSearchChange,
    pagination: {
      enabled: true,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: isLoading,
    emptyMessage: "No purchase orders found.",
    noResultsMessage: "No purchase orders found matching your search.",
  };

  const externalPagination = {
    currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.total,
    pageSize: recordsPerPage,
    onPageChange: setCurrentPage,
    onPageSizeChange: handleRecordsPerPageChange,
  };

  const footerActions = (
    <Button className="gap-2" onClick={handleCreatePurchaseOrder}>
      <Plus className="h-4 w-4" />
      Create New Purchase Order
    </Button>
  );

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Select value={selectedStatus} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              {selectedVendor?.name || "Select Vendor"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full sm:w-auto">
            <DropdownMenuItem
              onClick={() => handleVendorChange(null)}
              className={selectedVendor?.id === null ? "bg-accent" : ""}
            >
              All Vendors
            </DropdownMenuItem>
            {vendors?.map((vendor) => (
              <DropdownMenuItem
                key={vendor.Vendor_ID}
                onClick={() => handleVendorChange(vendor.Vendor_ID)}
                className={
                  selectedVendor?.id === vendor.Vendor_ID ? "bg-accent" : ""
                }
              >
                {vendor.Vendor_Name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex items-center gap-2">
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
          {dateRange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearDateRange}
              className="h-9 w-9"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="relative">
        <DataTable
          data={purchases}
          config={config}
          searchValue={searchTerm}
          externalPagination={externalPagination}
          onRowClick={handleRowClick}
          footerActions={footerActions}
        />

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">Loading purchase orders...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
