"use client";

import React, { useState } from "react";
import { CreateVendorForm } from "./components/create-vendor-form";
import { EditVendorForm } from "./components/edit-vendor-form";
import { DeleteVendorForm } from "./components/delete-vendor-form";
import { VendorsTable } from "./components/vendors-table";
import { Vendor } from "./interface";

const AllVendorsPage = () => {
  // Mock data for demonstration - replace with actual data fetching
  const [vendors] = useState<Vendor[]>([
    {
      Vendor_ID: "1",
      Vendor_Name: "Acme Corporation",
      Vendor_Mask_ID: "ACME001",
      NTN_Number: "1234567890123",
      STRN_Number: "9876543210987",
    },
    {
      Vendor_ID: "2",
      Vendor_Name: "Tech Solutions Ltd",
      Vendor_Mask_ID: "TECH002",
      NTN_Number: "2345678901234",
      STRN_Number: "8765432109876",
    },
    {
      Vendor_ID: "3",
      Vendor_Name: "Global Services Inc",
      Vendor_Mask_ID: "GLOBAL003",
      NTN_Number: "3456789012345",
      STRN_Number: "7654321098765",
    },
  ]);

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
