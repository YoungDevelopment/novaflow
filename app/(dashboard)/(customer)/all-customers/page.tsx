"use client";

import React, { useState } from "react";
import { CustomerForm } from "./components/customer-form";
import { DeleteCustomerForm } from "./components/delete-customer-form";
import { CustomersTable } from "./components/customers-table";
import { Customer } from "@/store/endpoints/customer/type";

const AllCustomersPage = () => {
  // Dialog state management
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUpdateMode, setIsUpdateMode] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsUpdateMode(true);
    setFormDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsUpdateMode(false);
    setFormDialogOpen(true);
  };

  const handleDelete = (customer: Customer) => {
    console.log("Delete Customer", customer.Customer_ID);
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleFormClose = () => {
    setFormDialogOpen(false);
    setSelectedCustomer(null);
    setIsUpdateMode(false);
  };

  const handleDeleteClose = () => {
    setDeleteDialogOpen(false);
    setSelectedCustomer(null);
  };
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Customer Management
          </h1>
          <p className="text-muted-foreground">
            Manage your customers and their information
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <CustomersTable
          onEdit={handleEdit}
          onDelete={handleDelete}
          onCreate={handleCreate}
        />
      </div>

      {/* Unified Form Dialog (Create/Edit) */}
      <CustomerForm
        customer={selectedCustomer}
        isOpen={formDialogOpen}
        isUpdate={isUpdateMode}
        onClose={handleFormClose}
      />

      {/* Delete Dialog */}
      <DeleteCustomerForm
        customer={selectedCustomer}
        isOpen={deleteDialogOpen}
        onClose={handleDeleteClose}
      />
    </main>
  );
};

export default AllCustomersPage;
