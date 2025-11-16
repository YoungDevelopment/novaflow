"use client";

import * as React from "react";
import { Trash2, Edit, Plus } from "lucide-react";
import { OrderItemForm } from "./order-items-form-dialog";
import { DeleteOrderItemForm } from "./delete-order-item-form";
import {
  DataTable,
  createColumn,
  createAction,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import type { OrderItem } from "@/store/endpoints/orderItems/type";
import { useFetchOrderItemsQuery, useFetchOrderHeaderByIdQuery } from "@/store";
import { useFetchHardwareQuery } from "@/store/endpoints/vendorHardware";
import { useFetchProductsQuery } from "@/store/endpoints/vendorProducts";
import { CompactLoader } from "@/app/(dashboard)/components";
import type { Hardware } from "@/store/endpoints/vendorHardware/type";
import type { Product } from "@/store/endpoints/vendorProducts/type";

interface OrderItemsTableProps {
  orderId: string;
}

export function OrderItemsTable({ orderId }: OrderItemsTableProps) {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [showOrderItemForm, setShowOrderItemForm] = React.useState(false);
  const [selectedOrderItem, setSelectedOrderItem] =
    React.useState<OrderItem | null>(null);
  const [showDeleteForm, setShowDeleteForm] = React.useState(false);
  const [orderItemToDelete, setOrderItemToDelete] =
    React.useState<OrderItem | null>(null);
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
  const { data: orderItemsData, isLoading: orderItemsLoading } =
    useFetchOrderItemsQuery({
      page: currentPage,
      limit: recordsPerPage,
      order_id: orderId,
      search: debouncedSearchTerm || undefined,
    });

  // Fetch order header to get vendor ID (entity_id)
  const { data: orderHeaderData } = useFetchOrderHeaderByIdQuery(
    { order_id: orderId },
    { skip: !orderId }
  );
  const vendorId = orderHeaderData?.data?.entity_id || "";

  // Fetch all hardware and products to get code descriptions
  const { data: allHardwareData } = useFetchHardwareQuery(
    { limit: 1000 },
    { skip: !vendorId }
  );
  const { data: allProductsData } = useFetchProductsQuery(
    { limit: 1000 },
    { skip: !vendorId }
  );

  // Extract data from RTK Query responses
  const data = orderItemsData?.data || [];
  const hardwareList = React.useMemo(
    () => allHardwareData?.data || [],
    [allHardwareData]
  );
  const productsList = React.useMemo(
    () => allProductsData?.data || [],
    [allProductsData]
  );

  // Helper function to get code description from product_code
  const getCodeDescription = React.useCallback(
    (orderItem: OrderItem): string => {
      if (orderItem.item_type === "Hardware") {
        const hardware = hardwareList.find(
          (h: Hardware) => h.Hardware_Code === orderItem.product_code
        );
        return hardware?.Hardware_Code_Description || orderItem.product_code;
      } else {
        const product = productsList.find(
          (p: Product) => p.Product_Code === orderItem.product_code
        );
        return product?.Product_Description || orderItem.product_code;
      }
    },
    [hardwareList, productsList]
  );
  const pagination = orderItemsData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    orderFiltered: "",
    search: "",
  };

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDelete = (orderItem: OrderItem) => {
    setOrderItemToDelete(orderItem);
    setShowDeleteForm(true);
  };

  const handleDeleteFormClose = () => {
    setShowDeleteForm(false);
    setOrderItemToDelete(null);
  };

  const handleCreateOrderItem = () => {
    setSelectedOrderItem(null);
    setShowOrderItemForm(true);
  };

  const handleUpdateOrderItem = (orderItem: OrderItem) => {
    setSelectedOrderItem(orderItem);
    setShowOrderItemForm(true);
  };

  const handleFormSuccess = () => {
    // RTK Query will automatically refetch due to cache invalidation
    setShowOrderItemForm(false);
    setSelectedOrderItem(null);
  };

  const columns = [
    createColumn<OrderItem>("movement", "Received", {
      align: "center",
      cell: (value) => (
        <div className="flex justify-center">
          <Checkbox checked={value === "Y"} disabled />
        </div>
      ),
    }),
    createColumn<OrderItem>("product_code", "Code Description", {
      align: "center",
      cell: (_value, row) => {
        const codeDescription = getCodeDescription(row);
        return (
          <div className="max-w-xs truncate" title={codeDescription}>
            {codeDescription}
          </div>
        );
      },
    }),
    createColumn<OrderItem>("description", "Description", {
      align: "center",
      cell: (value) => <div className="max-w-xs truncate">{value || "-"}</div>,
    }),
    createColumn<OrderItem>("unit", "Unit", {
      align: "center",
      cell: (value) => value || "-",
    }),
    createColumn<OrderItem>("kg", "KG", {
      align: "center",
      cell: (value) =>
        value && Number(value) !== 0
          ? Number(value).toFixed(2)
          : value === 0 || value === "0"
          ? "0.00"
          : "-",
    }),
    createColumn<OrderItem>("declared_amount", "Declared Amount", {
      align: "center",
      cell: (value) =>
        value && Number(value) !== 0
          ? Number(value).toFixed(2)
          : value === 0 || value === "0"
          ? "0.00"
          : "-",
    }),
    createColumn<OrderItem>("actual_amount", "Actual Amount", {
      align: "center",
      cell: (value) =>
        value && Number(value) !== 0
          ? Number(value).toFixed(2)
          : value === 0 || value === "0"
          ? "0.00"
          : "-",
    }),
  ];

  const actions = [
    createAction<OrderItem>("Update", handleUpdateOrderItem, {
      icon: <Edit className="mr-2 h-4 w-4" />,
    }),
    createAction<OrderItem>("Delete", handleDelete, {
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      className: "text-red-600",
    }),
  ];

  // Show pagination only when total entries > 5
  const showPagination = pagination.total > 5;

  const config = {
    columns,
    actions,
    searchable: true,
    searchPlaceholder: "Search order items...",
    backendSearch: true,
    onSearchChange: handleSearchChange,
    pagination: {
      enabled: showPagination,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: orderItemsLoading,
    emptyMessage: "No order items found.",
    noResultsMessage: "No order items found matching your search.",
  };

  const externalPagination = showPagination
    ? {
        currentPage,
        totalPages: pagination.totalPages,
        totalItems: pagination.total,
        pageSize: recordsPerPage,
        onPageChange: setCurrentPage,
        onPageSizeChange: handleRecordsPerPageChange,
      }
    : undefined;

  const footerActions = (
    <Button className="gap-2" onClick={handleCreateOrderItem}>
      <Plus className="h-4 w-4" />
      Add Order Item
    </Button>
  );

  return (
    <div className="w-full mt-6 space-y-4">
      <div className="relative">
        <DataTable
          data={data}
          config={config}
          searchValue={searchTerm}
          externalPagination={externalPagination}
          footerActions={footerActions}
        />

        {/* Loading overlay for all API calls */}
        {orderItemsLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">Loading order items...</span>
            </div>
          </div>
        )}
      </div>

      {showOrderItemForm && vendorId && (
        <OrderItemForm
          orderId={orderId}
          vendorId={vendorId}
          orderItem={selectedOrderItem}
          onClose={() => {
            setShowOrderItemForm(false);
            setSelectedOrderItem(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Dialog */}
      <DeleteOrderItemForm
        orderItem={orderItemToDelete}
        isOpen={showDeleteForm}
        onClose={handleDeleteFormClose}
      />
    </div>
  );
}
