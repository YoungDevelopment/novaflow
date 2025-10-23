"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronDown,
  Loader2,
  MoreHorizontal,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";
import { ProductForm } from "./product-form";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type Product = {
  Product_Code: string;
  Vendor_ID: string;
  Vendor_Name: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
  Created_At: string;
  Updated_At: string;
};

type ApiResponse = {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    vendorFiltered: string;
    search: string;
  };
};

type Vendor = {
  Vendor_Name: string;
  Vendor_ID: string;
};

const RECORDS_PER_PAGE_OPTIONS = [5, 10, 15, 20, 30, 40, 50];

function ActionMenu({
  product,
  onDelete,
  onUpdate,
}: {
  product: Product;
  onDelete: () => void;
  onUpdate: (product: Product) => void;
}) {
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (
      !confirm(
        `Are you sure you want to delete product ${product.Product_Code}?`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(
        "http://localhost:3000/api/vendor-product/delete-product",
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ Product_Code: product.Product_Code }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      onDelete();
    } catch (error) {
      console.error("Error deleting product:", error);
      alert("Failed to delete product");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
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
        <DropdownMenuItem onClick={() => onUpdate(product)}>
          <Edit className="mr-2 h-4 w-4" />
          Update
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          {isDeleting ? "Deleting..." : "Delete"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function VendorProductsTable() {
  const [vendors, setVendors] = React.useState<Vendor[]>([]);
  const [selectedVendor, setSelectedVendor] = React.useState<{
    id: string | null;
    name: string;
  } | null>({
    id: null,
    name: "All Vendors",
  });
  const [searchTerm, setSearchTerm] = React.useState<string>("");
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [data, setData] = React.useState<Product[]>([]);
  const [pagination, setPagination] = React.useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [vendorsLoading, setVendorsLoading] = React.useState<boolean>(true);
  const [showProductForm, setShowProductForm] = React.useState(false);
  const [selectedProduct, setSelectedProduct] = React.useState<Product | null>(
    null
  );

  React.useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch(
          "http://localhost:3000/api/vendor/fetch-all-vendor-names"
        );
        if (!response.ok) {
          throw new Error("Failed to fetch vendors");
        }
        const result = await response.json();
        setVendors(result.data);
      } catch (error) {
        console.error("Error fetching vendors:", error);
      } finally {
        setVendorsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  const fetchProducts = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchTerm,
        page: currentPage.toString(),
        limit: recordsPerPage.toString(),
      });

      if (selectedVendor?.id) {
        params.append("Vendor_ID", selectedVendor.id);
      }

      const response = await fetch(
        `http://localhost:3000/api/vendor-product/fetch-all-products?${params}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const result: ApiResponse = await response.json();
      setData(result.data);
      setPagination({
        total: result.pagination.total,
        page: result.pagination.page,
        limit: result.pagination.limit,
        totalPages: result.pagination.totalPages,
      });
    } catch (error) {
      console.error("Error fetching products:", error);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedVendor, searchTerm, currentPage, recordsPerPage]);

  React.useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleVendorChange = (vendorId: string | null) => {
    if (vendorId === null) {
      setSelectedVendor({ id: null, name: "All Vendors" });
    } else {
      const vendor = vendors.find((v) => v.Vendor_ID === vendorId);
      if (vendor) {
        setSelectedVendor({
          id: vendor.Vendor_ID,
          name: vendor.Vendor_Name,
        });
      }
    }
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleDeleteSuccess = () => {
    fetchProducts();
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
    fetchProducts();
  };

  const columns: ColumnDef<Product>[] = [
    {
      accessorKey: "Vendor_Name",
      header: () => <div className="text-center">Vendor Name</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("Vendor_Name")}</div>
      ),
    },
    {
      accessorKey: "Material",
      header: () => <div className="text-center">Material</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("Material")}</div>
      ),
    },
    {
      accessorKey: "Width",
      header: () => <div className="text-center">Width</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("Width")}</div>
      ),
    },
    {
      accessorKey: "Adhesive_Type",
      header: () => <div className="text-center">Adhesive Type</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("Adhesive_Type")}</div>
      ),
    },
    {
      accessorKey: "Paper_GSM",
      header: () => <div className="text-center">Paper GSM</div>,
      cell: ({ row }) => (
        <div className="text-center">{row.getValue("Paper_GSM")}</div>
      ),
    },
    {
      accessorKey: "Product_Description",
      header: () => <div className="text-center">Description</div>,
      cell: ({ row }) => (
        <div className="text-center max-w-xs truncate">
          {row.getValue("Product_Description")}
        </div>
      ),
    },
    {
      id: "actions",
      header: () => <div className="text-center">Actions</div>,
      cell: ({ row }) => {
        const product = row.original;
        return (
          <div className="flex justify-center">
            <ActionMenu
              product={product}
              onDelete={handleDeleteSuccess}
              onUpdate={handleUpdateProduct}
            />
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
        <Button className="gap-2" onClick={handleCreateProduct}>
          <Plus className="h-4 w-4" />
          Create New Product
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2">
          <label className="text-sm font-medium whitespace-nowrap">
            Vendor:
          </label>
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
              {vendors.map((vendor) => (
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

        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full sm:flex-1"
        />
      </div>

      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-center">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="text-center">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground text-left">
          Page {pagination.page} of {pagination.totalPages} ({pagination.total}{" "}
          total products)
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium whitespace-nowrap">
              Records per page:
            </label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-auto bg-transparent">
                  {recordsPerPage}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {RECORDS_PER_PAGE_OPTIONS.map((option) => (
                  <DropdownMenuItem
                    key={option}
                    onClick={() => handleRecordsPerPageChange(option)}
                    className={recordsPerPage === option ? "bg-accent" : ""}
                  >
                    {option}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) =>
                  Math.min(pagination.totalPages, prev + 1)
                )
              }
              disabled={currentPage >= pagination.totalPages || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

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
