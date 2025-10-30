import { baseApi } from "../../baseApi";
import {
  OrderNote,
  OrderNoteApiResponse,
  FetchOrderNoteParams,
  UpdateOrderNoteRequest,
} from "./type";

export const orderNotesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchOrderNote: builder.query<OrderNoteApiResponse, FetchOrderNoteParams>({
      query: (params) => ({
        url: `/order-notes/fetch-order-note?order_id=${params.order_id}`,
        method: "GET",
      }),
      providesTags: (result, error, { order_id }) =>
        result ? [{ type: "OrderNotes", id: order_id }] : ["OrderNotes"],
    }),

    updateOrderNote: builder.mutation<OrderNote, UpdateOrderNoteRequest>({
      query: (payload) => ({
        url: "/order-notes/update-order-note",
        method: "PATCH",
        body: payload,
      }),
      invalidatesTags: (result) =>
        result ? [{ type: "OrderNotes", id: result.order_id }] : ["OrderNotes"],
    }),
  }),
});

export const { useFetchOrderNoteQuery, useUpdateOrderNoteMutation } =
  orderNotesApi;
