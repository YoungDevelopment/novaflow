import { baseApi } from "../../baseApi";
import {
  Vendor,
  CreateVendorRequest,
  UpdateVendorRequest,
  VendorApiResponse,
  FetchVendorsParams,
} from "./type";

// Inject vendor endpoints into the base API
export const vendorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
        url: "/vendor/update-vendor",
        method: "PATCH",
        body: vendor,
      }),
      invalidatesTags: ["Vendor"],
    }),
    // Delete vendor
    deleteVendor: builder.mutation<{ success: boolean }, string>({
      query: (vendorId) => ({
        url: "/vendor/delete-vendor",
        method: "DELETE",
        body: { Vendor_ID: vendorId },
      }),
      invalidatesTags: ["Vendor"],
    }),
    // Fetch all vendors with pagination and filtering
    fetchVendors: builder.query<VendorApiResponse, FetchVendorsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        return {
          url: `/vendor/fetch-all-vendors?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["Vendor"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useCreateVendorMutation,
  useUpdateVendorMutation,
  useDeleteVendorMutation,
  useFetchVendorsQuery,
} = vendorApi;
