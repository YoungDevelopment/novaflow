"use client";

import React, { useState } from "react";
import { VendorForm } from "./components/vendor-form";
import { DeleteVendorForm } from "./components/delete-vendor-form";
import { VendorsTable } from "./components/vendors-table";
import { Vendor } from "@/store/endpoints/vendor/type";

const AllVendorsPage = () => {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setIsUpdateMode(true);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedVendor(null);
    setIsUpdateMode(false);
    setFormDialogOpen(true);
  };

  const handleDelete = (vendor: Vendor) => {
    console.log("Delete Vendor", vendor.Vendor_ID);
    setSelectedVendor(vendor);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setSelectedVendor(null);
    setIsUpdateMode(false);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedVendor(null);
  };
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Vendor Management
          </h1>
          <p className="text-muted-foreground">
            Manage your vendors and their information
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <VendorsTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      </div>

      {/* Unified Form Dialog (Create/Edit) */}
      <VendorForm
        vendor={selectedVendor}
        isOpen={formDialogOpen}
        isUpdate={isUpdateMode}
        onClose={handleFormClose}
      />

      {/* Delete Dialog */}
      <DeleteVendorForm
        vendor={selectedVendor}
        isOpen={deleteDialogOpen}
        onClose={handleDeleteClose}
      />
    </main>
  );
};

export default AllVendorsPage;
