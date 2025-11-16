import { baseApi } from "../../baseApi";
import {
  OrderChargeApiResponse,
  FetchOrderChargesParams,
  CreateOrderChargeRequest,
  UpdateOrderChargeRequest,
  DeleteOrderChargeRequest,
} from "./type";

export const orderChargesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchOrderCharges: builder.query<OrderChargeApiResponse, FetchOrderChargesParams>({
      query: (params = {}) => {
        const searchParams = new URLSearchParams();
        if (params.page) searchParams.append("page", params.page.toString());
        if (params.limit) searchParams.append("limit", params.limit.toString());
        return {
          url: `/order-charges/fetch-all-order-charges?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["OrderCharges"],
    }),

    createOrderCharge: builder.mutation<{ message: string; Order_Charges_ID: string }, CreateOrderChargeRequest>({
      query: (payload) => ({
        url: "/order-charges/create-order-charge",
        method: "POST",
        body: payload,
      }),
      invalidatesTags: (result, error, arg) => [
        "OrderCharges",
        { type: "OrderHeader", id: arg.Order_ID },
      ],
    }),

    updateOrderCharge: builder.mutation<{ message: string }, UpdateOrderChargeRequest>({
      query: (payload) => ({
        url: "/order-charges/update-order-charge",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result, error, arg) => [
        "OrderCharges",
        { type: "OrderHeader", id: arg.Order_ID },
      ],
    }),

    deleteOrderCharge: builder.mutation<{ message: string }, DeleteOrderChargeRequest>({
      query: (payload) => ({
        url: "/order-charges/delete-order-charge",
        method: "DELETE",
        body: payload,
      }),
      // payload doesn't include order id; invalidate all headers to be safe
      invalidatesTags: ["OrderCharges", "OrderHeader"],
    }),
  }),
});

export const {
  useFetchOrderChargesQuery,
  useCreateOrderChargeMutation,
  useUpdateOrderChargeMutation,
  useDeleteOrderChargeMutation,
} = orderChargesApi;


