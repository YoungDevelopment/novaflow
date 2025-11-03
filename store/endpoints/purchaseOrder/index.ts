import { baseApi } from "../../baseApi";
import {
  Purchase,
  PurchaseApiResponse,
  FetchPurchaseOrdersParams,
} from "./type";

// Inject purchase order endpoints into the base API
export const purchaseOrderApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Fetch purchase orders with pagination and filtering
    fetchPurchaseOrders: builder.query<
      PurchaseApiResponse,
      FetchPurchaseOrdersParams
    >({
      query: (params) => {
        const searchParams = new URLSearchParams();

        // type is required, always set to "Purchase"
        searchParams.append("type", "Purchase");

        if (params.page) {
          searchParams.append("page", params.page.toString());
        }
        if (params.limit) {
          searchParams.append("limit", params.limit.toString());
        }
        if (params.entity_id) {
          searchParams.append("entity_id", params.entity_id);
        }
        if (params.status && params.status.length > 0) {
          // Join multiple statuses with comma
          searchParams.append("status", params.status.join(","));
        }
        if (params.created_date) {
          searchParams.append("created_date", params.created_date);
        }
        if (params.start_date) {
          searchParams.append("start_date", params.start_date);
        }
        if (params.end_date) {
          searchParams.append("end_date", params.end_date);
        }

        return {
          url: `/order-list/fetch-orders?${searchParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: ["PurchaseOrder"],
    }),
  }),
});

// Export hooks for usage in functional components
export const { useFetchPurchaseOrdersQuery } = purchaseOrderApi;

