"use client";

import * as React from "react";
import { Edit, Trash2 } from "lucide-react";
import {
  DataTable,
  createColumn,
  createAction,
} from "@/components/ui/data-table";
import { Vendor } from "../interface";

interface VendorsTableProps {
  data: Vendor[];
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendorId: string) => void;
}

export function VendorsTable({ data, onEdit, onDelete }: VendorsTableProps) {
  const columns = [
    createColumn<Vendor>("Vendor_Name", "Vendor Name", {
      cell: (value) => <span className="font-medium">{value}</span>,
    }),
    createColumn<Vendor>("Vendor_Mask_ID", "Vendor Mask ID", {
      cell: (value) => (
        <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
          {value}
        </span>
      ),
    }),
    createColumn<Vendor>("NTN_Number", "NTN Number", {
      cell: (value) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
    }),
    createColumn<Vendor>("STRN_Number", "STRN Number", {
      cell: (value) =>
        value ? (
          <span className="font-mono text-sm">{value}</span>
        ) : (
          <span className="text-muted-foreground/60">N/A</span>
        ),
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
      createAction<Vendor>("Delete", (vendor) => onDelete(vendor.Vendor_ID), {
        icon: <Trash2 className="mr-2 h-4 w-4" />,
        className: "text-red-600",
      })
    );
  }

  const config = {
    columns,
    actions: actions.length > 0 ? actions : undefined,
    searchable: true,
    searchPlaceholder: "Search vendors...",
    searchFields: [
      "Vendor_Name",
      "Vendor_Mask_ID",
      "NTN_Number",
      "STRN_Number",
    ] as (keyof Vendor)[],
    pagination: {
      enabled: true,
      pageSize: 10,
      pageSizeOptions: [5, 10, 20, 30, 50, 100],
    },
    emptyMessage: "No vendors found.",
    noResultsMessage: "No vendors found matching your search.",
  };

  return <DataTable data={data} config={config} />;
}
