export interface OrderHeader {
  order_id: string;
  user: string;
  type: string;
  company?: string;
  status: string;
  total_due: number;
  entity_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrderHeaderRequest {
  user: string;
  type: string;
  status: string;
  entity_id: string;
  company?: string | null;
  total_due?: number;
}

export interface UpdateOrderHeaderRequest {
  order_id: string;
  user?: string;
  type?: string;
  company?: string | null;
  status?: string;
  total_due?: number;
  entity_id?: string;
}

export interface OrderHeaderApiResponse {
  data: OrderHeader;
}

export interface FetchOrderHeaderParams {
  order_id: string;
}
