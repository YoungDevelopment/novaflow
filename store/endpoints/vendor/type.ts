export interface Vendor {
  Vendor_ID: string;
  Vendor_Name: string;
  Vendor_Mask_ID: string;
  NTN_Number?: string;
  STRN_Number?: string;
  Address_1?: string;
  Address_2?: string;
  Contact_Number?: string;
  Contact_Person?: string;
  Email_ID?: string;
  Website?: string;
  Created_At?: string;
  Updated_At?: string;
}

export interface CreateVendorRequest {
  Vendor_Name: string;
  Vendor_Mask_ID: string;
  NTN_Number?: string | null;
  STRN_Number?: string | null;
  Address_1?: string | null;
  Address_2?: string | null;
  Contact_Number?: string | null;
  Contact_Person?: string | null;
  Email_ID?: string | null;
  Website?: string | null;
}

export interface UpdateVendorRequest {
  Vendor_ID: string;
  Vendor_Name: string;
  Vendor_Mask_ID: string;
  NTN_Number?: string | null;
  STRN_Number?: string | null;
  Address_1?: string | null;
  Address_2?: string | null;
  Contact_Number?: string | null;
  Contact_Person?: string | null;
  Email_ID?: string | null;
  Website?: string | null;
}

export interface VendorApiResponse {
  data: Vendor[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    search: string;
  };
}

export interface FetchVendorsParams {
  search?: string;
  page?: number;
  limit?: number;
}
