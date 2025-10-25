"use client";

import * as React from "react";
import { ChevronDown, Loader2, Trash2, Edit, Plus } from "lucide-react";
import { ProductForm } from "./product-form";
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
  useFetchProductsQuery,
  useFetchVendorNamesQuery,
  useDeleteProductMutation,
} from "@/store/endpoints/vendorProducts";

export function VendorProductsTable() {
  const [selectedVendor, setSelectedVendor] = React.useState<{
    id: string | null;
    name: string;
  } | null>({
    id: null,
    name: "All Vendors",
  });
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
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
  const { data: vendorsData, isLoading: vendorsLoading } =
    useFetchVendorNamesQuery();

  const { data: productsData, isLoading: productsLoading } =
    useFetchProductsQuery({
      page: currentPage,
      limit: recordsPerPage,
      Vendor_ID: selectedVendor?.id || undefined,
      search: debouncedSearchTerm || undefined,
    });

  const [deleteProduct] = useDeleteProductMutation();

  // Extract data from RTK Query responses
  const vendors = vendorsData?.data || [];
  const data = productsData?.data || [];
  const pagination = productsData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
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

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDelete = async (product: Product) => {
    if (
      !confirm(
        `Are you sure you want to delete product ${product.Product_Code}?`
      )
    ) {
      return;
    }

    try {
      await deleteProduct({ Product_Code: product.Product_Code }).unwrap();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    }
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
    createColumn<Product>("Vendor_Name", "Vendor Name", {
      align: "center",
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
    loading: productsLoading,
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
        <label className="text-sm font-medium whitespace-nowrap">Vendor:</label>
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
      </div>
      <Button className="gap-2" onClick={handleCreateProduct}>
        <Plus className="h-4 w-4" />
        Create New Product
      </Button>
    </div>
  );

  if (vendorsLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading vendors...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4 p-2 sm:p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-lg font-semibold">Vendor Products</h2>
      </div>

      <DataTable
        data={data}
        config={config}
        headerActions={headerActions}
        searchValue={searchTerm}
        externalPagination={externalPagination}
      />

      {showProductForm && (
        <ProductForm
          product={selectedProduct}
          onClose={() => setShowProductForm(false)}
          onSuccess={handleFormSuccess}
        />
      )}
    </div>
  );
}
