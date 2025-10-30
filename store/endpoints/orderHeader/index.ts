import { baseApi } from "../../baseApi";
import {
  OrderHeader,
  CreateOrderHeaderRequest,
  UpdateOrderHeaderRequest,
  OrderHeaderApiResponse,
  FetchOrderHeaderParams,
} from "./type";

// Inject order header endpoints into the base API
export const orderHeaderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create new order header
    createOrderHeader: builder.mutation<OrderHeader, CreateOrderHeaderRequest>({
      query: (order) => ({
        url: "/order-header/create-order-header",
        method: "POST",
        body: order,
      }),
      invalidatesTags: ["OrderHeader"],
    }),
    // Fetch order header by ID
    fetchOrderHeaderById: builder.query<
      OrderHeaderApiResponse,
      FetchOrderHeaderParams
    >({
      query: (params) => ({
        url: `/order-header/fetch-order-by-id?order_id=${params.order_id}`,
        method: "GET",
      }),
      providesTags: (result, error, { order_id }) =>
        result ? [{ type: "OrderHeader", id: order_id }] : [],
    }),
    // Update order header
    updateOrderHeader: builder.mutation<OrderHeader, UpdateOrderHeaderRequest>({
      query: (order) => ({
        url: "/order-header/update-order-header",
        method: "PATCH",
        body: order,
      }),
      invalidatesTags: (result, error, { order_id }) =>
        result ? [{ type: "OrderHeader", id: order_id }] : [],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useCreateOrderHeaderMutation,
  useFetchOrderHeaderByIdQuery,
  useUpdateOrderHeaderMutation,
} = orderHeaderApi;
