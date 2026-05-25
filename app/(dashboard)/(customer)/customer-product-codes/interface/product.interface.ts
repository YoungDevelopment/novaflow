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

export interface Customer {
  Customer_Name: string;
  Customer_ID: string;
  Customer_Mask_ID?: string;
}
