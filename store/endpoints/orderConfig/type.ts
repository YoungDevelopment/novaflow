export interface OrderConfig {
  order_config_id: string;
  order_id: string;
  tax_percentage: number;
  committed_date?: string;
  entity_order?: string;
  gate_pass?: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertOrderConfigRequest {
  order_id: string;
  tax_percentage?: number;
  committed_date?: string | null;
  entity_order?: string | null;
  gate_pass?: string | null;
}

export interface OrderConfigApiResponse {
  data: OrderConfig;
}

export interface FetchOrderConfigParams {
  order_id: string;
}
