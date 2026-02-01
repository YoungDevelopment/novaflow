export interface Hardware {
  Hardware_Code: string;
  Vendor_ID: string;
  Vendor_Name: string;
  Hardware_Name: string;
  Hardware_Description: string;
  Hardware_Code_Description: string;
  Created_At: string;
  Updated_At: string;
}

export interface HardwareApiResponse {
  data: Hardware[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    vendorFiltered: string;
    search: string;
  };
}

export interface FetchHardwareParams {
  search?: string;
  page?: number;
  limit?: number;
  Vendor_ID?: string;
}

export interface CreateHardwareRequest {
  Vendor_ID: string;
  Hardware_Name: string;
  Hardware_Description: string;
  Hardware_Code_Description: string;
}

export interface DeleteHardwareRequest {
  Hardware_Code: string;
}

export interface UpdateHardwareRequest {
  Hardware_Code: string;
  Vendor_ID?: string;
  Hardware_Name?: string;
  Hardware_Description?: string;
  Hardware_Code_Description?: string;
}
