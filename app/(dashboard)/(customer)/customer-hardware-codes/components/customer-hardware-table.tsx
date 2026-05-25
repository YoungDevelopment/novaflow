"use client";

import * as React from "react";
import { ChevronDown, Trash2, Edit, Plus } from "lucide-react";
import { Hardware } from "../interface";
import { HardwareForm } from "./hardware-form";
import { DeleteHardwareForm } from "./delete-hardware-form";
import {
  DataTable,
  createColumn,
  createAction,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFetchCustomerHardwareQuery } from "@/store";
import { useFetchCustomerNamesQuery } from "@/store/endpoints/customerProducts";
import { CompactLoader } from "@/app/(dashboard)/components";

export function CustomerHardwareTable() {
  const [selectedCustomer, setSelectedCustomer] = React.useState<{
    id: string | null;
    name: string;
  } | null>({
    id: null,
    name: "All Customers",
  });
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] =
    React.useState<string>("");
  const [showHardwareForm, setShowHardwareForm] = React.useState(false);
  const [selectedHardware, setSelectedHardware] =
    React.useState<Hardware | null>(null);
  const [showDeleteForm, setShowDeleteForm] = React.useState(false);
  const [hardwareToDelete, setHardwareToDelete] =
    React.useState<Hardware | null>(null);

  // Debounce search term
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // RTK Query hooks
  const { data: customersData, isLoading: customersLoading } =
    useFetchCustomerNamesQuery();

  const { data: hardwareData, isLoading: hardwareLoading } =
    useFetchCustomerHardwareQuery({
      page: currentPage,
      limit: recordsPerPage,
      Customer_ID: selectedCustomer?.id || undefined,
      search: debouncedSearchTerm || undefined,
    });

  // Extract data from RTK Query responses
  const customers = customersData?.data || [];
  const data = hardwareData?.data || [];
  const pagination = hardwareData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    customerFiltered: "All Customers",
    search: "",
  };

  const handleCustomerChange = (customerId: string | null) => {
    if (customerId === null) {
      setSelectedCustomer({ id: null, name: "All Customers" });
    } else {
      const customer = customers?.find((v) => v.Customer_ID === customerId);
      if (customer) {
        setSelectedCustomer({
          id: customer.Customer_ID,
          name: customer.Customer_Name,
        });
      }
    }
    setCurrentPage(1);
  };

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setSelectedHardware(null);
    setShowHardwareForm(true);
  };

  const handleUpdate = (hardware: Hardware) => {
    setSelectedHardware(hardware);
    setShowHardwareForm(true);
  };

  const handleFormSuccess = () => {
    setShowHardwareForm(false);
    setSelectedHardware(null);
  };

  const handleDelete = (hardware: Hardware) => {
    setHardwareToDelete(hardware);
    setShowDeleteForm(true);
  };

  const handleDeleteFormClose = () => {
    setShowDeleteForm(false);
    setHardwareToDelete(null);
  };

  const columns = [
    createColumn<Hardware>("Customer_Name", "Customer Name", {
      align: "center",
    }),
    createColumn<Hardware>("HS_Code", "HS Code", {
      align: "center",
      cell: (value) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
    }),
    createColumn<Hardware>("Hardware_Name", "Hardware Name", {
      align: "center",
    }),
    createColumn<Hardware>("Hardware_Description", "Description", {
      align: "center",
      cell: (value) => <div className="max-w-xs truncate">{value}</div>,
    }),
    createColumn<Hardware>("Hardware_Code_Description", "Code Description", {
      align: "center",
      cell: (value) => <div className="max-w-xs truncate">{value}</div>,
    }),
    createColumn<Hardware>("Customer_Description", "Customer Description", {
      align: "center",
      cell: (value) =>
        value ? (
          <div className="max-w-xs truncate">{value}</div>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
    }),
  ];

  const actions = [
    createAction<Hardware>("Update", handleUpdate, {
      icon: <Edit className="mr-2 h-4 w-4" />,
    }),
    createAction<Hardware>("Delete", handleDelete, {
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      className: "text-red-600",
    }),
  ];

  const config = {
    columns,
    actions,
    searchable: true,
    searchPlaceholder: "Search hardware...",
    backendSearch: true,
    onSearchChange: handleSearchChange,
    pagination: {
      enabled: true,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: hardwareLoading || customersLoading,
    emptyMessage: "No hardware found.",
    noResultsMessage: "No hardware found matching your search.",
  };

  const externalPagination = {
    currentPage,
    totalPages: pagination.totalPages,
    totalItems: pagination.total,
    pageSize: recordsPerPage,
    onPageChange: setCurrentPage,
    onPageSizeChange: handleRecordsPerPageChange,
  };

  const headerActions = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
        <label className="text-sm font-medium whitespace-nowrap">Customer:</label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto bg-transparent"
            >
              {selectedCustomer?.name || "Select Customer"}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full sm:w-auto">
            <DropdownMenuItem
              onClick={() => handleCustomerChange(null)}
              className={selectedCustomer?.id === null ? "bg-accent" : ""}
            >
              All Customers
            </DropdownMenuItem>
            {customers?.map((customer) => (
              <DropdownMenuItem
                key={customer.Customer_ID}
                onClick={() => handleCustomerChange(customer.Customer_ID)}
                className={
                  selectedCustomer?.id === customer.Customer_ID ? "bg-accent" : ""
                }
              >
                {customer.Customer_Name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );

  const footerActions = (
    <Button className="gap-2" onClick={handleCreate}>
      <Plus className="h-4 w-4" />
      Create New Hardware
    </Button>
  );

  return (
    <div className="w-full space-y-4">
      <div className="relative">
        <DataTable
          data={data}
          config={config}
          headerActions={headerActions}
          searchValue={searchTerm}
          externalPagination={externalPagination}
          footerActions={footerActions}
        />

        {/* Loading overlay for all API calls */}
        {(hardwareLoading || customersLoading) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">
                {customersLoading ? "Loading customers..." : "Loading hardware..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Hardware Form Dialog */}
      {showHardwareForm && (
        <HardwareForm
          hardware={selectedHardware}
          onClose={() => {
            setShowHardwareForm(false);
            setSelectedHardware(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Dialog */}
      <DeleteHardwareForm
        hardware={hardwareToDelete}
        isOpen={showDeleteForm}
        onClose={handleDeleteFormClose}
      />
    </div>
  );
}
