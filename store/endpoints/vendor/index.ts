import { baseApi } from "../../baseApi";
import { Vendor, CreateVendorRequest, UpdateVendorRequest } from "./type";

// Inject vendor endpoints into the base API
export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all vendors with a limit of 1000
    getVendors: builder.query<{ data: Vendor[]; pagination: any }, void>({
      query: () => ({
        url: "/vendor/fetch-all-vendors?limit=1000&page=1",
        method: "GET",
      }),
      providesTags: ["Vendor"],
    }),
    // Create new vendor
    createVendor: builder.mutation<Vendor, CreateVendorRequest>({
      query: (vendor) => ({
        url: "/vendor/create-new-vendor",
        method: "POST",
        body: vendor,
      }),
      invalidatesTags: ["Vendor"],
    }),
    // Update existing vendor
    updateVendor: builder.mutation<Vendor, UpdateVendorRequest>({
      query: (vendor) => ({
        url: `/vendor/${vendor.Vendor_ID}`,
        method: "PUT",
        body: vendor,
      }),
      invalidatesTags: ["Vendor"],
    }),
    // Delete vendor
    deleteVendor: builder.mutation<{ success: boolean }, string>({
      query: (vendorId) => ({
        url: `/vendor/${vendorId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Vendor"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useGetVendorsQuery,
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
} = vendorApi;
