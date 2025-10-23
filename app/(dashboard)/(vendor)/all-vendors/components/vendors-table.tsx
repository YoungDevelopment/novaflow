"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Vendor } from "../interface";

interface VendorsTableProps {
  data: Vendor[];
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendorId: string) => void;
}

export function VendorsTable({ data, onEdit, onDelete }: VendorsTableProps) {
  const [searchTerm, setSearchTerm] = React.useState("");

  // Filter data based on search term
  const filteredData = React.useMemo(() => {
    if (!searchTerm) return data;
    return data.filter(
      (vendor) =>
        vendor.Vendor_Name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vendor.Vendor_Mask_ID.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        (vendor.NTN_Number &&
          vendor.NTN_Number.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (vendor.STRN_Number &&
          vendor.STRN_Number.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [data, searchTerm]);

  return (
    <div className="w-full space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search vendors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>
        <div className="text-sm text-muted-foreground">
          {filteredData.length} vendor(s) found
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Vendor Name</TableHead>
              <TableHead className="font-semibold">Vendor Mask ID</TableHead>
              <TableHead className="font-semibold">NTN Number</TableHead>
              <TableHead className="font-semibold">STRN Number</TableHead>
              {(onEdit || onDelete) && (
                <TableHead className="font-semibold text-right">
                  Actions
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length > 0 ? (
              filteredData.map((vendor) => (
                <TableRow key={vendor.Vendor_ID} className="hover:bg-muted/50">
                  <TableCell className="font-medium">
                    {vendor.Vendor_Name}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                      {vendor.Vendor_Mask_ID}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vendor.NTN_Number ? (
                      <span className="font-mono text-sm">
                        {vendor.NTN_Number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">N/A</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {vendor.STRN_Number ? (
                      <span className="font-mono text-sm">
                        {vendor.STRN_Number}
                      </span>
                    ) : (
                      <span className="text-muted-foreground/60">N/A</span>
                    )}
                  </TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        {onEdit && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEdit(vendor)}
                          >
                            Edit
                          </Button>
                        )}
                        {onDelete && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => onDelete(vendor.Vendor_ID)}
                          >
                            Delete
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={onEdit || onDelete ? 5 : 4}
                  className="h-24 text-center text-muted-foreground"
                >
                  {searchTerm
                    ? "No vendors found matching your search."
                    : "No vendors found."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
