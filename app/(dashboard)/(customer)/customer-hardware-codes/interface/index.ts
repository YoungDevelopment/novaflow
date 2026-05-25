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

export interface HardwareCollection {
  Hardware_Name: string;
  Hardware_Mask_ID: string;
}

export interface Customer {
  Customer_Name: string;
  Customer_ID: string;
  Customer_Mask_ID?: string;
}

export interface HardwareFormProps {
  hardware?: Hardware | null;
  onClose: () => void;
  onSuccess: () => void;
}
