"use client";

import React, { useState } from "react";
import { CreateVendorForm } from "./components/create-vendor-form";
import { VendorsTable } from "./components/vendors-table";
import { Vendor } from "./interface";

const AllVendorsPage = () => {
  // Mock data for demonstration - replace with actual data fetching
  const [vendors, setVendors] = useState<Vendor[]>([
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

  const handleEdit = (vendor: Vendor) => {
    console.log("Edit vendor:", vendor);
    // Implement edit functionality
  };

  const handleDelete = (vendorId: string) => {
    console.log("Delete vendor:", vendorId);
    // Implement delete functionality
    setVendors(vendors.filter((v) => v.Vendor_ID !== vendorId));
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
    </main>
  );
};

export default AllVendorsPage;
