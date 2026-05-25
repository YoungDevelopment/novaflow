export interface Hardware {
  Hardware_Code: string;
  Customer_ID: string;
  Customer_Name: string;
  Hardware_Name: string;
  Hardware_Description: string;
  Hardware_Code_Description: string;
  HS_Code?: string;
  Customer_Description?: string;
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
    customerFiltered: string;
    search: string;
  };
}

export interface FetchHardwareParams {
  search?: string;
  page?: number;
  limit?: number;
  Customer_ID?: string;
}

export interface CreateHardwareRequest {
  Customer_ID: string;
  Hardware_Name: string;
  Hardware_Description: string;
  Hardware_Code_Description: string;
  HS_Code?: string | null;
  Customer_Description?: string | null;
}

export interface DeleteHardwareRequest {
  Hardware_Code: string;
}

export interface UpdateHardwareRequest {
  Hardware_Code: string;
  Customer_ID?: string;
  Hardware_Name?: string;
  Hardware_Description?: string;
  Hardware_Code_Description?: string;
  HS_Code?: string | null;
  Customer_Description?: string | null;
}
