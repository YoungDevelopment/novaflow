import { baseApi } from "../../baseApi";
import {
  Product,
  ProductApiResponse,
  VendorApiResponse,
  CreateProductRequest,
  UpdateProductRequest,
  DeleteProductRequest,
  FetchProductsParams,
} from "./type";

// Inject vendor products endpoints into the base API
export const vendorProductsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all products with pagination and filtering
    fetchProducts: builder.query<ProductApiResponse, FetchProductsParams>({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.search) searchParams.append("search", params.search);
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.Vendor_ID)
          searchParams.append("Vendor_ID", params.Vendor_ID);

        return {
          url: `/vendor-product/fetch-all-products?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["VendorProduct"],
    }),

    // Fetch all vendor names
    fetchVendorNames: builder.query<VendorApiResponse, void>({
      query: () => ({
        url: "/vendor/fetch-all-vendor-names",
        method: "GET",
      }),
      providesTags: ["Vendor"],
    }),

    // Create new product
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (product) => ({
        url: "/vendor-product/create-new-product",
        method: "POST",
        body: product,
      }),
      invalidatesTags: ["VendorProduct"],
    }),

    // Update existing product
    updateProduct: builder.mutation<Product, UpdateProductRequest>({
      query: (product) => ({
        url: "/vendor-product/update-product",
        method: "PATCH",
        body: product,
      }),
      invalidatesTags: ["VendorProduct"],
    }),

    // Delete product
    deleteProduct: builder.mutation<{ success: boolean }, DeleteProductRequest>(
      {
        query: (product) => ({
          url: "/vendor-product/delete-product",
          method: "DELETE",
          body: product,
        }),
        invalidatesTags: ["VendorProduct"],
      }
    ),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchProductsQuery,
  useFetchVendorNamesQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
} = vendorProductsApi;
