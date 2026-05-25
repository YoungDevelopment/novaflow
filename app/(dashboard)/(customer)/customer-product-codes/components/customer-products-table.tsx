"use client";

import * as React from "react";
import { ChevronDown, Trash2, Edit, Plus } from "lucide-react";
import { ProductForm } from "./product-form";
import { DeleteProductForm } from "./delete-product-form";
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
import { Product } from "../interface";
import {
  useFetchCustomerProductsQuery,
  useFetchCustomerNamesQuery,
} from "@/store/endpoints/customerProducts";
import { CompactLoader } from "@/app/(dashboard)/components";

export function CustomerProductsTable() {
  const [selectedCustomer, setSelectedCustomer] = React.useState<{
    id: string | null;
    name: string;
  } | null>({
    id: null,
    name: "All Customers",
  });
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );
  const [showDeleteForm, setShowDeleteForm] = React.useState(false);
  const [productToDelete, setProductToDelete] = React.useState<Product | null>(
    null
  );
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

  // RTK Query hooks
  const { data: customersData, isLoading: customersLoading } =
    useFetchCustomerNamesQuery();

  const { data: productsData, isLoading: productsLoading } =
    useFetchCustomerProductsQuery({
      page: currentPage,
      limit: recordsPerPage,
      Customer_ID: selectedCustomer?.id || undefined,
      search: debouncedSearchTerm || undefined,
    });

  // Extract data from RTK Query responses
  const customers = customersData?.data || [];
  const data = productsData?.data || [];
  const pagination = productsData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
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
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
    setShowDeleteForm(true);
  };

  const handleDeleteFormClose = () => {
    setShowDeleteForm(false);
    setProductToDelete(null);
  };

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setShowProductForm(true);
  };

  const handleUpdateProduct = (product: Product) => {
    setSelectedProduct(product);
    setShowProductForm(true);
  };

  const handleFormSuccess = () => {
    // RTK Query will automatically refetch due to cache invalidation
    setShowProductForm(false);
  };

  const columns = [
    createColumn<Product>("Customer_Name", "Customer Name", {
      align: "center",
    }),
    createColumn<Product>("HS_Code", "HS Code", {
      align: "center",
      cell: (value) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
    }),
    createColumn<Product>("Material", "Material", {
      align: "center",
    }),
    createColumn<Product>("Width", "Width", {
      align: "center",
    }),
    createColumn<Product>("Adhesive_Type", "Adhesive Type", {
      align: "center",
    }),
    createColumn<Product>("Paper_GSM", "Paper GSM", {
      align: "center",
    }),
    createColumn<Product>("Product_Description", "Description", {
      align: "center",
      cell: (value) => <div className="max-w-xs truncate">{value}</div>,
    }),
    createColumn<Product>("Customer_Description", "Customer Description", {
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
    createAction<Product>("Update", handleUpdateProduct, {
      icon: <Edit className="mr-2 h-4 w-4" />,
    }),
    createAction<Product>("Delete", handleDelete, {
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      className: "text-red-600",
    }),
  ];

  const config = {
    columns,
    actions,
    searchable: true,
    searchPlaceholder: "Search products...",
    backendSearch: true,
    onSearchChange: handleSearchChange,
    pagination: {
      enabled: true,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: productsLoading || customersLoading,
    emptyMessage: "No products found.",
    noResultsMessage: "No products found matching your search.",
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
    <Button className="gap-2" onClick={handleCreateProduct}>
      <Plus className="h-4 w-4" />
      Create New Product
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
        {(productsLoading || customersLoading) && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">
                {customersLoading ? "Loading customers..." : "Loading products..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {showProductForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => setShowProductForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Dialog */}
      <DeleteProductForm
        product={productToDelete}
        isOpen={showDeleteForm}
        onClose={handleDeleteFormClose}
      />
    </div>
  );
}
