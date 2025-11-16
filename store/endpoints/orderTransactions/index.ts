import { baseApi } from "../../baseApi";
import {
  OrderTransactionApiResponse,
  FetchOrderTransactionsParams,
  CreateOrderTransactionRequest,
  UpdateOrderTransactionRequest,
  DeleteOrderTransactionRequest,
} from "./type";

// Inject order transactions endpoints into the base API
export const orderTransactionsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch all order transactions with pagination and filtering
    fetchOrderTransactions: builder.query<
      OrderTransactionApiResponse,
      FetchOrderTransactionsParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit)
          searchParams.append("limit", params.limit.toString());
        if (params.order_id) searchParams.append("order_id", params.order_id);

        return {
          url: `/order-transactions/fetch-all-order-transactions?${searchParams}`,
          method: "GET",
        };
      },
      providesTags: ["OrderTransactions"],
    }),

    // Create new order transaction
    createOrderTransaction: builder.mutation<
      { message: string },
      CreateOrderTransactionRequest
    >({
      query: (orderTransaction) => ({
        url: "/order-transactions/create-order-transaction",
        method: "POST",
        body: orderTransaction,
      }),
      invalidatesTags: (result, error, arg) => [
        "OrderTransactions",
        { type: "OrderHeader", id: arg.Order_ID },
      ],
    }),

    // Update order transaction
    updateOrderTransaction: builder.mutation<
      { message: string },
      UpdateOrderTransactionRequest
    >({
      query: (orderTransaction) => ({
        url: "/order-transactions/update-order-transaction",
        method: "PATCH",
        body: orderTransaction,
      }),
      invalidatesTags: (result, error, arg) => [
        "OrderTransactions",
        ...(arg.Order_ID ? [{ type: "OrderHeader", id: arg.Order_ID } as const] : []),
      ],
    }),

    // Delete order transaction
    deleteOrderTransaction: builder.mutation<
      { message: string },
      DeleteOrderTransactionRequest
    >({
      query: (orderTransaction) => ({
        url: "/order-transactions/delete-order-transaction",
        method: "DELETE",
        body: orderTransaction,
      }),
      // Delete payload doesn't contain Order_ID; invalidate all headers to ensure refresh
      invalidatesTags: ["OrderTransactions", "OrderHeader"],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchOrderTransactionsQuery,
  useCreateOrderTransactionMutation,
  useUpdateOrderTransactionMutation,
  useDeleteOrderTransactionMutation,
} = orderTransactionsApi;

