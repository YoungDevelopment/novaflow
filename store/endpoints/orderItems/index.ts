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
      invalidatesTags: (result, error, arg) => [
        "OrderItems",
        { type: "OrderHeader", id: (arg as CreateOrderItemRequest).order_id },
      ],
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
      invalidatesTags: (result, error, arg) => [
        "OrderItems",
        ...(arg.order_id ? [{ type: "OrderHeader", id: arg.order_id } as const] : []),
      ],
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
      // We don't have order_id in the delete request; invalidate all OrderHeader to be safe
      invalidatesTags: ["OrderItems", "OrderHeader"],
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
