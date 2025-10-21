import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

// Create the base API slice
export const baseApi = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: "/api",
    prepareHeaders: (headers) => {
      // Add any auth headers here if needed
      headers.set("Content-Type", "application/json");
      return headers;
    },
  }),
  tagTypes: ["Vendor"],
  endpoints: () => ({}), // Empty endpoints object - will be injected
});
