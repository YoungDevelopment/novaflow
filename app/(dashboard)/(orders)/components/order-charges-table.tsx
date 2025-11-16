"use client";

import * as React from "react";
import { Edit, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataTable, createAction, createColumn } from "@/components/ui/data-table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useFetchOrderChargesQuery } from "@/store";
import type { OrderCharge } from "@/store/endpoints/orderCharges/type";
import OrderChargesForm from "./order-charges-form";
import { DeleteOrderChargeForm } from "./delete-order-charge-form";

interface OrderChargesTableProps {
  orderId: string;
}

export function OrderChargesTable({ orderId }: OrderChargesTableProps) {
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [recordsPerPage, setRecordsPerPage] = React.useState<number>(10);
  const [showForm, setShowForm] = React.useState(false);
  const [selectedCharge, setSelectedCharge] = React.useState<OrderCharge | null>(null);
  const [showDeleteForm, setShowDeleteForm] = React.useState(false);
  const [chargeToDelete, setChargeToDelete] = React.useState<OrderCharge | null>(null);

  // Since API fetch-all has no filtering, fetch a large set and filter client-side by orderId
  const { data: apiData, isLoading } = useFetchOrderChargesQuery({
    page: 1,
    limit: 1000,
  });

  const allCharges = React.useMemo(() => apiData?.data || [], [apiData]);
  const data = React.useMemo(
    () => allCharges.filter((c: OrderCharge) => c.Order_ID === orderId),
    [allCharges, orderId]
  );

  const pagination = React.useMemo(
    () => ({
      total: data.length,
      page: currentPage,
      limit: recordsPerPage,
      totalPages: Math.ceil(data.length / recordsPerPage) || 1,
    }),
    [data.length, currentPage, recordsPerPage]
  );

  const handleRecordsPerPageChange = (limit: number) => {
    setRecordsPerPage(limit);
    setCurrentPage(1);
  };

  const handleCreate = () => {
    setSelectedCharge(null);
    setShowForm(true);
  };

  const handleUpdate = (charge: OrderCharge) => {
    setSelectedCharge(charge);
    setShowForm(true);
  };

  const handleDelete = (charge: OrderCharge) => {
    setChargeToDelete(charge);
    setShowDeleteForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setSelectedCharge(null);
  };

  const columns = [
    createColumn<OrderCharge>("Description", "Description", {
      align: "center",
    }),
    createColumn<OrderCharge>("Charges", "Charges", {
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
    createAction<OrderCharge>("Update", handleUpdate, {
      icon: <Edit className="mr-2 h-4 w-4" />,
    }),
    createAction<OrderCharge>("Delete", handleDelete, {
      icon: <Trash2 className="mr-2 h-4 w-4" />,
      className: "text-red-600",
    }),
  ];

  const showPagination = data.length > 5;

  const config = {
    columns,
    actions,
    searchable: false,
    pagination: {
      enabled: showPagination,
      pageSize: recordsPerPage,
      pageSizeOptions: [5, 10, 15, 20, 30, 40, 50],
    },
    loading: isLoading,
    emptyMessage: "No order charges found.",
    noResultsMessage: "No order charges found.",
  };

  const pagedData = React.useMemo(() => {
    if (!showPagination) return data;
    const start = (currentPage - 1) * recordsPerPage;
    return data.slice(start, start + recordsPerPage);
  }, [data, currentPage, recordsPerPage, showPagination]);

  const footerActions = (
    <Button className="gap-2" onClick={handleCreate}>
      <Plus className="h-4 w-4" />
      Add Charge
    </Button>
  );

  return (
    <div className="w-full mt-6 space-y-4">
      <DataTable
        data={pagedData}
        config={config}
        externalPagination={
          showPagination
            ? {
                currentPage,
                totalPages: pagination.totalPages,
                totalItems: pagination.total,
                pageSize: recordsPerPage,
                onPageChange: setCurrentPage,
                onPageSizeChange: handleRecordsPerPageChange,
              }
            : undefined
        }
        footerActions={footerActions}
      />

      {/* Create/Update Form Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCharge ? "Update Charge" : "Add Charge"}</DialogTitle>
          </DialogHeader>
          <OrderChargesForm
            orderId={orderId}
            charge={selectedCharge}
            onSuccess={handleFormSuccess}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <DeleteOrderChargeForm
        charge={chargeToDelete}
        isOpen={showDeleteForm}
        onClose={() => {
          setShowDeleteForm(false);
          setChargeToDelete(null);
        }}
      />
    </div>
  );
}


