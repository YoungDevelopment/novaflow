export interface Purchase {
  order_id: string;
  user: string;
  type: string;
  company: string;
  status: string;
  total_due: string | number;
  entity_id: string;
  created_at: string;
  updated_at: string;
}

export interface PurchaseApiResponse {
  data: Purchase[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface FetchPurchaseOrdersParams {
  page?: number;
  limit?: number;
  entity_id?: string;
  status?: string[]; // Comma-separated status values
  created_date?: string; // Single date: YYYY-MM-DD format
  start_date?: string; // Start date for range: YYYY-MM-DD format
  end_date?: string; // End date for range: YYYY-MM-DD format
}

