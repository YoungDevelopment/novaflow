import { baseApi } from "../../baseApi";
import {
  HardwareApiResponse,
  FetchHardwareParams,
  CreateHardwareRequest,
  UpdateHardwareRequest,
  DeleteHardwareRequest,
} from "./type";

// Inject customer hardware endpoints into the base API
export const customerHardwareApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all hardware with pagination and filtering
    fetchCustomerHardware: builder.query<
      HardwareApiResponse,
      FetchHardwareParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.Customer_ID)
          searchParams.append("Customer_ID", params.Customer_ID);

        return {
          url: `/customer-hardware/fetch-all-hardware?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerHardware"],
    }),

    // Create new hardware
    createCustomerHardware: builder.mutation<
      { message: string },
      CreateHardwareRequest
    >({
      query: (hardware) => ({
        url: "/customer-hardware/create-new-hardware",
        method: "POST",
        body: hardware,
      }),
      invalidatesTags: ["CustomerHardware"],
    }),

    // Update hardware
    updateCustomerHardware: builder.mutation<
      { message: string },
      UpdateHardwareRequest
    >({
      query: (hardware) => ({
        url: "/customer-hardware/update-hardware",
        method: "PATCH",
        body: hardware,
      }),
      invalidatesTags: ["CustomerHardware"],
    }),

    // Delete hardware
    deleteCustomerHardware: builder.mutation<
      { message: string },
      DeleteHardwareRequest
    >({
      query: (hardware) => ({
        url: "/customer-hardware/delete-hardware",
        method: "DELETE",
        body: hardware,
      }),
      invalidatesTags: ["CustomerHardware"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchCustomerHardwareQuery,
  useCreateCustomerHardwareMutation,
  useUpdateCustomerHardwareMutation,
  useDeleteCustomerHardwareMutation,
} = customerHardwareApi;
