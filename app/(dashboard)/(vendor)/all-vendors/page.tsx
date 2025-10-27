"use client";

import React, { useState } from "react";
import { CreateVendorForm } from "./components/create-vendor-form";
import { EditVendorForm } from "./components/edit-vendor-form";
import { DeleteVendorForm } from "./components/delete-vendor-form";
import { VendorsTable } from "./components/vendors-table";
import { Vendor } from "./interface";
import { useGetVendorsQuery } from "@/store/endpoints/vendor";

const AllVendorsPage = () => {
  // Fetch vendors using RTK Query
  const { data, isLoading, error } = useGetVendorsQuery();

  // Extract vendors from response or default to empty array
  const vendors: Vendor[] = data?.data || [];

  // Dialog state management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);

  const handleEdit = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditDialogOpen(true);
  };

  const handleDelete = (vendorId: string) => {
    const vendor = vendors.find((v) => v.Vendor_ID === vendorId);
    if (vendor) {
      setSelectedVendor(vendor);
      setDeleteDialogOpen(true);
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedVendor(null);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedVendor(null);
  };

  if (isLoading) {
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
          <CreateVendorForm />
        </div>
        <div className="flex items-center justify-center p-12">
          <p className="text-muted-foreground">Loading vendors...</p>
        </div>
      </main>
    );
  }

  if (error) {
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
          <CreateVendorForm />
        </div>
        <div className="flex items-center justify-center p-12">
          <p className="text-red-500">
            Error loading vendors. Please try again.
          </p>
        </div>
      </main>
    );
  }

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
        <CreateVendorForm />
      </div>

      <div className="space-y-4">
        <VendorsTable
          data={vendors}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Edit Dialog */}
      <EditVendorForm
        vendor={selectedVendor}
        isOpen={editDialogOpen}
        onClose={handleEditClose}
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
