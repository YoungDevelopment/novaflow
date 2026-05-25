import { baseApi } from "../../baseApi";
import {
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  CustomerApiResponse,
  FetchCustomersParams,
} from "./type";

// Inject customer endpoints into the base API
export const customerApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create new customer
    createCustomer: builder.mutation<Customer, CreateCustomerRequest>({
      query: (customer) => ({
        url: "/customer/create-new-customer",
        method: "POST",
        body: customer,
      }),
      invalidatesTags: ["Customer"],
    }),
    // Update existing customer
    updateCustomer: builder.mutation<Customer, UpdateCustomerRequest>({
      query: (customer) => ({
        url: "/customer/update-customer",
        method: "PATCH",
        body: customer,
      }),
      invalidatesTags: ["Customer"],
    }),
    // Delete customer
    deleteCustomer: builder.mutation<{ success: boolean }, string>({
      query: (customerId) => ({
        url: "/customer/delete-customer",
        method: "DELETE",
        body: { Customer_ID: customerId },
      }),
      invalidatesTags: ["Customer"],
    }),
    // Fetch all customers with pagination and filtering
    fetchCustomers: builder.query<CustomerApiResponse, FetchCustomersParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());

        return {
          url: `/customer/fetch-all-customers?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["Customer"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useCreateCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useFetchCustomersQuery,
} = customerApi;
