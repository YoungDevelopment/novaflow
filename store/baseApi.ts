import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create the base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api",
    prepareHeaders: (headers) => {
      // Add any auth headers here if needed
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: [
    "Vendor",
    "VendorProduct",
    "VendorHardware",
    "OrderNotes",
    "OrderHeader",
    "OrderConfig",
    "OrderItems",
    "PurchaseOrder",
  ],
  endpoints: () => ({}), // Empty endpoints object - will be injected
});
