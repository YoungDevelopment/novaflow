export interface OrderItem {
  order_item_id: string;
  order_id: string;
  movement: string;
  product_code: string;
  item_type: string;
  description: string;
  hs_code: string;
  unit: string;
  kg: number;
  declared_price_per_unit: number;
  declared_price_per_kg: number;
  actual_price_per_unit: number;
  actual_price_per_kg: number;
  declared_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}

export interface OrderItemApiResponse {
  data: OrderItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    orderFiltered: string;
    search: string;
  };
}

export interface FetchOrderItemsParams {
  search?: string;
  page?: number;
  limit?: number;
  order_id?: string;
}

export interface CreateOrderItemRequest {
  order_id: string;
  movement?: "Y" | "N";
  product_code: string;
  item_type?: string;
  description?: string;
  hs_code?: string;
  unit?: string;
  kg?: number;
  declared_price_per_unit?: number;
  declared_price_per_kg?: number;
  actual_price_per_unit?: number;
  actual_price_per_kg?: number;
  declared_amount?: number;
  actual_amount?: number;
}

export interface DeleteOrderItemRequest {
  order_item_id: string;
}

export interface UpdateOrderItemRequest {
  order_item_id: string;
  order_id?: string;
  movement?: "Y" | "N";
  product_code?: string;
  item_type?: string;
  description?: string;
  hs_code?: string | null;
  unit?: string;
  kg?: number;
  declared_price_per_unit?: number;
  declared_price_per_kg?: number;
  actual_price_per_unit?: number;
  actual_price_per_kg?: number;
  declared_amount?: number;
  actual_amount?: number;
}

