import { baseApi } from "../../baseApi";
import {
  OrderInventoryApiResponse,
  FetchOrderInventoryParams,
  CreateOrderInventoryRequest,
  UpdateOrderInventoryRequest,
  DeleteOrderInventoryRequest,
  CheckSplitEligibilityResponse,
  CheckSplitEligibilityParams,
  FetchSplitOptionsResponse,
  FetchSplitOptionsParams,
  SubmitSplitRequest,
  SubmitSplitResponse,
  SyncToInventoryRequest,
  SyncToInventoryResponse,
} from "./type";

// Inject order inventory endpoints into the base API
export const orderInventoryApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all order inventory with pagination and filtering
    fetchOrderInventory: builder.query<
      OrderInventoryApiResponse,
      FetchOrderInventoryParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        if (params.order_id) searchParams.append("order_id", params.order_id);
        if (params.mode) searchParams.append("mode", params.mode);
        if (params.search) searchParams.append("search", params.search);

        return {
          url: `/order-inventory/fetch-all-order-inventory?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["OrderInventory"],
    }),

    // Create new order inventory
    createOrderInventory: builder.mutation<
      { message: string },
      CreateOrderInventoryRequest
    >({
      query: (orderInventory) => ({
        url: "/order-inventory/create-order-inventory",
        method: "POST",
        body: orderInventory,
      }),
      invalidatesTags: (result, error, arg) => [
        "OrderInventory",
        { type: "OrderHeader", id: arg.order_id },
      ],
    }),

    // Update order inventory
    updateOrderInventory: builder.mutation<
      { message: string },
      UpdateOrderInventoryRequest
    >({
      query: (orderInventory) => ({
        url: "/order-inventory/update-order-inventory",
        method: "PATCH",
        body: orderInventory,
      }),
      invalidatesTags: (result, error, arg) => [
        "OrderInventory",
        ...(arg.order_id
          ? [{ type: "OrderHeader", id: arg.order_id } as const]
          : []),
      ],
    }),

    // Delete order inventory
    deleteOrderInventory: builder.mutation<
      { message: string },
      DeleteOrderInventoryRequest
    >({
      query: (orderInventory) => ({
        url: "/order-inventory/delete-order-inventory",
        method: "DELETE",
        body: orderInventory,
      }),
      // Delete payload doesn't contain order_id; invalidate all headers to ensure refresh
      invalidatesTags: ["OrderInventory", "OrderHeader"],
    }),

    // Check split eligibility
    checkSplitEligibility: builder.query<
      CheckSplitEligibilityResponse,
      CheckSplitEligibilityParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        if (params.inventory_id) {
          searchParams.append("inventory_id", params.inventory_id);
        }
        if (params.barcode_tag) {
          searchParams.append("barcode_tag", params.barcode_tag);
        }
        if (params.product_code) {
          searchParams.append("product_code", params.product_code);
        }
        return {
          url: `/order-inventory/check-split-eligibility?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["OrderInventory"],
    }),

    // Fetch split options
    fetchSplitOptions: builder.query<
      FetchSplitOptionsResponse,
      FetchSplitOptionsParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();
        searchParams.append("product_code", params.product_code);
        searchParams.append("remaining_width", params.remaining_width.toString());
        if (params.is_first_split !== undefined) {
          searchParams.append(
            "is_first_split",
            params.is_first_split.toString()
          );
        }
        return {
          url: `/order-inventory/fetch-split-options?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["OrderInventory"],
    }),

    // Submit split
    submitSplit: builder.mutation<SubmitSplitResponse, SubmitSplitRequest>({
      query: (splitRequest) => ({
        url: "/order-inventory/submit-split",
        method: "POST",
        body: splitRequest,
      }),
      invalidatesTags: ["OrderInventory", "OrderHeader"],
    }),

    // Sync order items to inventory
    syncToInventory: builder.mutation<
      SyncToInventoryResponse,
      SyncToInventoryRequest
    >({
      query: (body) => ({
        url: "/order-inventory/sync-to-inventory",
        method: "POST",
        body,
      }),
      invalidatesTags: ["OrderInventory", "OrderHeader"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchOrderInventoryQuery,
  useCreateOrderInventoryMutation,
  useUpdateOrderInventoryMutation,
  useDeleteOrderInventoryMutation,
  useCheckSplitEligibilityQuery,
  useFetchSplitOptionsQuery,
  useSubmitSplitMutation,
  useSyncToInventoryMutation,
} = orderInventoryApi;
