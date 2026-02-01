export interface Product {
  Product_Code: string;
  Vendor_ID: string;
  Vendor_Name: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
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
    vendorFiltered: string;
    search: string;
  };
}

export interface VendorApiResponse {
  data: {
    Vendor_Name: string;
    Vendor_ID: string;
    Vendor_Mask_ID?: string;
  }[];
}

export interface CreateProductRequest {
  Vendor_ID: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
}

export interface UpdateProductRequest {
  Product_Code: string;
  Vendor_ID: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
}

export interface DeleteProductRequest {
  Product_Code: string;
}

export interface FetchProductsParams {
  search?: string;
  page?: number;
  limit?: number;
  Vendor_ID?: string;
}
