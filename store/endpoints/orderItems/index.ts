import { baseApi } from "../../baseApi";
import {
  OrderItemApiResponse,
  FetchOrderItemsParams,
  CreateOrderItemRequest,
  UpdateOrderItemRequest,
  DeleteOrderItemRequest,
} from "./type";

// Inject order items endpoints into the base API
export const orderItemsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all order items with pagination and filtering
    fetchOrderItems: builder.query<OrderItemApiResponse, FetchOrderItemsParams>(
      {
        query: (params) => {
          const searchParams = new URLSearchParams();

          if (params.search) searchParams.append("search", params.search);
          if (params.page) searchParams.append("page", params.page.toString());
          if (params.limit)
            searchParams.append("limit", params.limit.toString());
          if (params.order_id) searchParams.append("order_id", params.order_id);

          return {
            url: `/order-items/fetch-all-order-items?${searchParams}`,
            method: "GET",
          };
        },
        providesTags: ["OrderItems"],
      }
    ),

    // Create new order item
    createOrderItem: builder.mutation<
      { message: string },
      CreateOrderItemRequest
    >({
      query: (orderItem) => ({
        url: "/order-items/create-order-item",
        method: "POST",
        body: orderItem,
      }),
      invalidatesTags: ["OrderItems"],
    }),

    // Update order item
    updateOrderItem: builder.mutation<
      { message: string },
      UpdateOrderItemRequest
    >({
      query: (orderItem) => ({
        url: "/order-items/update-order-item",
        method: "PATCH",
        body: orderItem,
      }),
      invalidatesTags: ["OrderItems"],
    }),

    // Delete order item
    deleteOrderItem: builder.mutation<
      { message: string },
      DeleteOrderItemRequest
    >({
      query: (orderItem) => ({
        url: "/order-items/delete-order-item",
        method: "DELETE",
        body: orderItem,
      }),
      invalidatesTags: ["OrderItems"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchOrderItemsQuery,
  useCreateOrderItemMutation,
  useUpdateOrderItemMutation,
  useDeleteOrderItemMutation,
} = orderItemsApi;
