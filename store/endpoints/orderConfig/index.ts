import { baseApi } from "../../baseApi";
import {
  OrderConfig,
  UpsertOrderConfigRequest,
  OrderConfigApiResponse,
  FetchOrderConfigParams,
} from "./type";

// Inject order config endpoints into the base API
export const orderConfigApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch order config by order_id
    fetchOrderConfig: builder.query<
      OrderConfigApiResponse,
      FetchOrderConfigParams
    >({
      query: (params) => ({
        url: `/order-config/fetch-order-config?order_id=${params.order_id}`,
        method: "GET",
      }),
      providesTags: (result, error, { order_id }) =>
        result ? [{ type: "OrderConfig", id: order_id }] : [],
    }),
    // Upsert order config (create or update)
    upsertOrderConfig: builder.mutation<OrderConfig, UpsertOrderConfigRequest>({
      query: (orderConfig) => ({
        url: "/order-config/upsert-order-config",
        method: "POST",
        body: orderConfig,
      }),
      invalidatesTags: (result, error, { order_id }) =>
        result ? [{ type: "OrderConfig", id: order_id }] : [],
    }),
    // Update order config (PATCH - partial update)
    patchOrderConfig: builder.mutation<OrderConfig, UpsertOrderConfigRequest>({
      query: (orderConfig) => ({
        url: "/order-config/upsert-order-config",
        method: "PATCH",
        body: orderConfig,
      }),
      invalidatesTags: (result, error, { order_id }) =>
        result ? [{ type: "OrderConfig", id: order_id }] : [],
    }),
  }),
});

// Export hooks for usage in functional components
export const {
  useFetchOrderConfigQuery,
  useUpsertOrderConfigMutation,
  usePatchOrderConfigMutation,
} = orderConfigApi;
