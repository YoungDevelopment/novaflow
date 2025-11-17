"use client";

import * as React from "react";
import { Trash2, Edit, Plus } from "lucide-react";
import { OrderTransactionForm } from "./order-transactions-form-dialog";
import { DeleteOrderTransactionForm } from "./delete-order-transaction-form";
import {
  DataTable,
  createColumn,
  createAction,
} from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import type { OrderTransaction } from "@/store/endpoints/orderTransactions/type";
import { useFetchOrderTransactionsQuery } from "@/store/endpoints/orderTransactions";
import { CompactLoader } from "@/app/(dashboard)/components";

interface OrderTransactionsTableProps {
  orderId: string;
  orderType?: string;
}

export function OrderTransactionsTable({
  orderId,
  orderType = "Purchase",
}: OrderTransactionsTableProps) {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [showTransactionForm, setShowTransactionForm] = React.useState(false);
  const [selectedTransaction, setSelectedTransaction] =
    React.useState<OrderTransaction | null>(null);
  const [showDeleteForm, setShowDeleteForm] = React.useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    React.useState<OrderTransaction | null>(null);

  // RTK Query hooks
  const { data: transactionsData, isLoading: transactionsLoading } =
    useFetchOrderTransactionsQuery({
      page: currentPage,
      limit: recordsPerPage,
      order_id: orderId,
    });

  // Extract data from RTK Query responses
  const data = transactionsData?.data || [];
  const pagination = transactionsData?.pagination || {
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    orderFiltered: "",
  };

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleDelete = (transaction: OrderTransaction) => {
    setTransactionToDelete(transaction);
    setShowDeleteForm(true);
  };

  const handleDeleteFormClose = () => {
    setShowDeleteForm(false);
    setTransactionToDelete(null);
  };

  const handleCreateTransaction = () => {
    setSelectedTransaction(null);
    setShowTransactionForm(true);
  };

  const handleUpdateTransaction = (transaction: OrderTransaction) => {
    setSelectedTransaction(transaction);
    setShowTransactionForm(true);
  };

  const handleFormSuccess = () => {
    // RTK Query will automatically refetch due to cache invalidation
    setShowTransactionForm(false);
    setSelectedTransaction(null);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const columns = [
    createColumn<OrderTransaction>("Transaction_Date", "Transaction Date", {
      align: "center",
      cell: (value) => formatDate(value || ""),
    }),
    createColumn<OrderTransaction>("Type", "Type", {
      align: "center",
      cell: (value) => value || "-",
    }),
    createColumn<OrderTransaction>("Order_Payment_Type", "Payment Type", {
      align: "center",
      cell: (value) => value || "-",
    }),
    createColumn<OrderTransaction>("Payment_Method", "Payment Method", {
      align: "center",
      cell: (value) => value || "-",
    }),
    createColumn<OrderTransaction>("Actual_Amount", "Actual Amount", {
      align: "center",
      cell: (value) =>
        value && Number(value) !== 0
          ? Number(value).toFixed(2)
          : value === 0 || value === "0"
          ? "0.00"
          : "-",
    }),
    createColumn<OrderTransaction>("Decalred_Amount", "Declared Amount", {
      align: "center",
      cell: (value) =>
        value && Number(value) !== 0
          ? Number(value).toFixed(2)
          : value === 0 || value === "0"
          ? "0.00"
          : "-",
    }),
    createColumn<OrderTransaction>("Notes", "Notes", {
      align: "center",
      cell: (value) => {
        if (!value) return "-";
        const truncated =
          value.length > 5 ? value.substring(0, 5) + "..." : value;
        return (
          <div className="max-w-xs truncate" title={value}>
            {truncated}
          </div>
        );
      },
    }),
  ];

  const actions = [
    createAction<OrderTransaction>("Update", handleUpdateTransaction, {
      icon: <Edit className="mr-2 h-4 w-4" />,
    }),
    createAction<OrderTransaction>("Delete", handleDelete, {
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      className: "text-red-600",
    }),
  ];

  // Show pagination only when total entries > 5
  const showPagination = pagination.total > 5;

  const config = {
    columns,
    actions,
    searchable: false,
    pagination: {
      enabled: showPagination,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: transactionsLoading,
    emptyMessage: "No transactions found.",
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
    <Button className="gap-2" onClick={handleCreateTransaction}>
      <Plus className="h-4 w-4" />
      Add Transaction
    </Button>
  );

  return (
    <div className="w-full mt-6 space-y-4">
      <div className="relative">
        <DataTable
          data={data}
          config={config}
          externalPagination={externalPagination}
          footerActions={footerActions}
        />

        {/* Loading overlay for all API calls */}
        {transactionsLoading && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span className="text-sm">Loading transactions...</span>
            </div>
          </div>
        )}
      </div>

      {showTransactionForm && (
        <OrderTransactionForm
          orderId={orderId}
          transaction={selectedTransaction}
          orderType={orderType}
          onClose={() => {
            setShowTransactionForm(false);
            setSelectedTransaction(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete Dialog */}
      <DeleteOrderTransactionForm
        transaction={transactionToDelete}
        isOpen={showDeleteForm}
        onClose={handleDeleteFormClose}
      />
    </div>
  );
}
