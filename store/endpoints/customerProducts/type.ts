export interface Product {
  Product_Code: string;
  Customer_ID: string;
  Customer_Name: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
  HS_Code?: string;
  Customer_Description?: string;
  Created_At: string;
  Updated_At: string;
}

export interface ProductApiResponse {
  data: Product[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    customerFiltered: string;
    search: string;
  };
}

export interface CustomerApiResponse {
  data: {
    Customer_Name: string;
    Customer_ID: string;
    Customer_Mask_ID?: string;
  }[];
}

export interface CreateProductRequest {
  Customer_ID: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
  HS_Code?: string | null;
  Customer_Description?: string | null;
}

export interface UpdateProductRequest {
  Product_Code: string;
  Customer_ID: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
  HS_Code?: string | null;
  Customer_Description?: string | null;
}

export interface DeleteProductRequest {
  Product_Code: string;
}

export interface FetchProductsParams {
  search?: string;
  page?: number;
  limit?: number;
  Customer_ID?: string;
}
