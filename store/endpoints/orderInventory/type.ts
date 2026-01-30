export interface OrderInventory {
  inventory_id?: string;
  order_id?: string;
  order_transaction_type?: string;
  order_payment_type?: string;
  type: string;
  product_code?: string;
  unit_quantity?: number | string;
  kg_quantity?: number | string;
  barcode_tag?: string;
  declared_price_per_unit?: number | string;
  declared_price_per_kg?: number | string;
  actual_price_per_unit?: number | string;
  actual_price_per_kg?: number | string;
  created_at?: string;
  updated_at?: string;
  description?: string;
  total_unit_quantity?: number | string;
  actaul_price_per_unit?: number | string; // Note: typo in API response
  item_count?: number | string;
}

export interface OrderInventoryApiResponse {
  data: OrderInventory[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    orderFiltered: string;
  };
}

export interface FetchOrderInventoryParams {
  page?: number;
  limit?: number;
  order_id?: string;
  mode?: "all" | "available";
  search?: string;
}

export interface CreateOrderInventoryRequest {
  order_id: string;
  order_transaction_type: string;
  order_payment_type: string;
  type: string;
  product_code: string;
  unit_quantity?: number;
  kg_quantity?: number;
  declared_price_per_unit?: number;
  declared_price_per_kg?: number;
  actual_price_per_unit?: number;
  actual_price_per_kg?: number;
}

export interface DeleteOrderInventoryRequest {
  inventory_id: string;
}

export interface UpdateOrderInventoryRequest {
  inventory_id: string;
  order_id?: string;
  order_transaction_type?: string;
  order_payment_type?: string;
  type?: string;
  product_code?: string;
  unit_quantity?: number;
  kg_quantity?: number;
  declared_price_per_unit?: number;
  declared_price_per_kg?: number;
  actual_price_per_unit?: number;
  actual_price_per_kg?: number;
}

// Split Inventory Types
export interface CheckSplitEligibilityResponse {
  eligible: boolean;
  available_sqm: number;
  product_code: string;
  original_width: number;
  vendor_id: string;
  adhesive_type: string;
  paper_gsm: number;
  material: string;
  inventory_id?: string; // Returned when using barcode_tag lookup
}

export interface CheckSplitEligibilityParams {
  inventory_id?: string;
  barcode_tag?: string;
  product_code?: string;
}

export interface SplitOption {
  product_code: string;
  width: number;
  product_description: string;
}

export interface FetchSplitOptionsResponse {
  options: SplitOption[];
}

export interface FetchSplitOptionsParams {
  product_code: string;
  remaining_width: number;
  is_first_split?: boolean;
}

export interface SubmitSplitRequest {
  inventory_id: string;
  requested_sqm: number;
  splits: Array<{
    product_code: string;
  }>;
}

export interface SubmitSplitResponse {
  message: string;
  breakdown?: Array<{
    inventory_id: string;
    product_code: string;
    width: number;
    allocated_sqm: number;
  }>;
}

// Sync to Inventory Types
export interface SyncToInventoryRequest {
  order_id: string;
}

export interface SyncToInventoryResponse {
  message: string;
  synced_count: number;
  created_count: number;
  updated_count: number;
}
