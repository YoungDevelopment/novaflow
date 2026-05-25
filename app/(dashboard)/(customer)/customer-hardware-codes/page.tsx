import React from "react";
import { CustomerHardwareTable } from "./components/customer-hardware-table";

const CustomerHardwareCodesPage = () => {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Customer Hardware Codes
          </h1>
          <p className="text-muted-foreground">
            Manage your customer hardware codes and their information
          </p>
        </div>
      </div>
      <CustomerHardwareTable />
    </main>
  );
};

export default CustomerHardwareCodesPage;
