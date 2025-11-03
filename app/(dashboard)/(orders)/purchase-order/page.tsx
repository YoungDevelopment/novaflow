"use client";

import React from "react";
import { PurchaseOrdersTable } from "./components/purchase-orders-table";

const PurchaseOrderPage = () => {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Purchase Orders
          </h1>
          <p className="text-muted-foreground">
            Manage and filter your purchase orders
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <PurchaseOrdersTable />
      </div>
    </main>
  );
};

export default PurchaseOrderPage;

