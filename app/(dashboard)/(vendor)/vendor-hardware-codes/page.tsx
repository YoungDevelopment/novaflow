import React from "react";
import { VendorHardwareTable } from "./components/vendor-hardware-table";

const VendorHardwareCodesPage = () => {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Vendor Hardware Codes
          </h1>
          <p className="text-muted-foreground">
            Manage your vendor hardware codes and their information
          </p>
        </div>
      </div>
      <VendorHardwareTable />
    </main>
  );
};

export default VendorHardwareCodesPage;
