export interface OrderNote {
  order_note_id: string;
  order_id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

export interface FetchOrderNoteParams {
  order_id: string;
}

export interface OrderNoteApiResponse {
  data: OrderNote;
}

export interface UpdateOrderNoteRequest {
  order_note_id: string;
  note?: string | null;
}
