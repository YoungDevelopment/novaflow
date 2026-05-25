import { baseApi } from "../../baseApi";
import {
  Product,
  ProductApiResponse,
  CustomerApiResponse,
  CreateProductRequest,
  UpdateProductRequest,
  DeleteProductRequest,
  FetchProductsParams,
} from "./type";

// Inject customer products endpoints into the base API
export const customerProductsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all products with pagination and filtering
    fetchCustomerProducts: builder.query<ProductApiResponse, FetchProductsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.Customer_ID)
          searchParams.append("Customer_ID", params.Customer_ID);

        return {
          url: `/customer-product/fetch-all-products?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["CustomerProduct"],
    }),

    // Fetch all customer names
    fetchCustomerNames: builder.query<CustomerApiResponse, void>({
      query: () => ({
        url: "/customer/fetch-all-customer-names",
        method: "GET",
      }),
      providesTags: ["Customer"],
    }),

    // Create new product
    createCustomerProduct: builder.mutation<Product, CreateProductRequest>({
      query: (product) => ({
        url: "/customer-product/create-new-product",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["CustomerProduct"],
    }),

    // Update existing product
    updateCustomerProduct: builder.mutation<Product, UpdateProductRequest>({
      query: (product) => ({
        url: "/customer-product/update-product",
        method: "PATCH",
        body: product,
      }),
      invalidatesTags: ["CustomerProduct"],
    }),

    // Delete product
    deleteCustomerProduct: builder.mutation<
      { success: boolean },
      DeleteProductRequest
    >(
      {
        query: (product) => ({
          url: "/customer-product/delete-product",
          method: "DELETE",
          body: product,
        }),
        invalidatesTags: ["CustomerProduct"],
      }
    ),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchCustomerProductsQuery,
  useFetchCustomerNamesQuery,
  useCreateCustomerProductMutation,
  useUpdateCustomerProductMutation,
  useDeleteCustomerProductMutation,
} = customerProductsApi;
