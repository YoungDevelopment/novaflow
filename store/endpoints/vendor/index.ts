import { baseApi } from "../../baseApi";

// Define types for vendor data based on actual API structure
export interface Vendor {
  Vendor_ID: string;
  Vendor_Name: string;
  Vendor_Mask_ID: string;
  NTN_Number?: string;
  STRN_Number?: string;
  Address_1?: string;
  Address_2?: string;
  Contact_Number?: string;
  Contact_Person?: string;
  Email_ID?: string;
  Website?: string;
}

export interface CreateVendorRequest {
  Vendor_Name: string;
  Vendor_Mask_ID: string;
  NTN_Number?: string | null;
  STRN_Number?: string | null;
  Address_1?: string | null;
  Address_2?: string | null;
  Contact_Number?: string | null;
  Contact_Person?: string | null;
  Email_ID?: string | null;
  Website?: string | null;
}

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
  }),
});

// Export hooks for usage in functional components
export const { useCreateVendorMutation } = vendorApi;
