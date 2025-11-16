export interface OrderTransaction {
  Order_Transcation_ID: string;
  Order_ID: string;
  Transaction_Date: string;
  Type: string;
  Order_Payment_Type: string;
  Payment_Method: string;
  Actual_Amount: number;
  Decalred_Amount: number;
  Notes: string;
  Created_Date: string;
  created_at: string;
  updated_at: string;
}

export interface OrderTransactionApiResponse {
  data: OrderTransaction[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    orderFiltered: string;
  };
}

export interface FetchOrderTransactionsParams {
  page?: number;
  limit?: number;
  order_id?: string;
}

export interface CreateOrderTransactionRequest {
  Order_ID: string;
  Transaction_Date?: string;
  Type?: string;
  Order_Payment_Type?: string;
  Payment_Method?: string;
  Actual_Amount: number;
  Decalred_Amount?: number;
  Notes?: string;
}

export interface DeleteOrderTransactionRequest {
  Order_Transcation_ID: string;
}

export interface UpdateOrderTransactionRequest {
  Order_Transcation_ID: string;
  Order_ID?: string;
  Transaction_Date?: string;
  Type?: string;
  Order_Payment_Type?: string;
  Payment_Method?: string;
  Actual_Amount?: number;
  Decalred_Amount?: number;
  Notes?: string;
}
