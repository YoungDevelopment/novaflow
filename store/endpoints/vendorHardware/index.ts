import { baseApi } from "../../baseApi";
import {
  HardwareApiResponse,
  FetchHardwareParams,
  CreateHardwareRequest,
  UpdateHardwareRequest,
  DeleteHardwareRequest,
} from "./type";

// Inject vendor hardware endpoints into the base API
export const vendorHardwareApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all hardware with pagination and filtering
    fetchHardware: builder.query<HardwareApiResponse, FetchHardwareParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.Vendor_ID)
          searchParams.append("Vendor_ID", params.Vendor_ID);

        return {
          url: `/vendor-hardware/fetch-all-hardware?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["VendorHardware"],
    }),

    // Create new hardware
    createHardware: builder.mutation<
      { message: string },
      CreateHardwareRequest
    >({
      query: (hardware) => ({
        url: "/vendor-hardware/create-new-hardware",
        method: "POST",
        body: hardware,
      }),
      invalidatesTags: ["VendorHardware"],
    }),

    // Update hardware
    updateHardware: builder.mutation<
      { message: string },
      UpdateHardwareRequest
    >({
      query: (hardware) => ({
        url: "/vendor-hardware/update-hardware",
        method: "PATCH",
        body: hardware,
      }),
      invalidatesTags: ["VendorHardware"],
    }),

    // Delete hardware
    deleteHardware: builder.mutation<
      { message: string },
      DeleteHardwareRequest
    >({
      query: (hardware) => ({
        url: "/vendor-hardware/delete-hardware",
        method: "DELETE",
        body: hardware,
      }),
      invalidatesTags: ["VendorHardware"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchHardwareQuery,
  useCreateHardwareMutation,
  useUpdateHardwareMutation,
  useDeleteHardwareMutation,
} = vendorHardwareApi;
