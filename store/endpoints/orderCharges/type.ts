export interface OrderCharge {
  Order_Charges_ID: string;
  Order_ID: string;
  Description: string;
  Charges: number;
}

export interface OrderChargeApiResponse {
  data: OrderCharge[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface FetchOrderChargesParams {
  page?: number;
  limit?: number;
}

export interface CreateOrderChargeRequest {
  Order_ID: string;
  Description: string;
  Charges: number;
}

export interface UpdateOrderChargeRequest {
  Order_Charges_ID: string;
  Order_ID: string;
  Description: string;
  Charges: number;
}

export interface DeleteOrderChargeRequest {
  Order_Charges_ID: string;
}


