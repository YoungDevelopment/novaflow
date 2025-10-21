import React from "react";
import { CreateVendorForm } from "./components/create-vendor-form";

const allVendorsPage = () => {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Vendor Management
          </h1>
          <p className="text-muted-foreground">
            Click the button below to open the vendor form dialog
          </p>
        </div>

        <div className="flex justify-center">
          <CreateVendorForm />
        </div>
      </div>
    </main>
  );
};

export default allVendorsPage;
