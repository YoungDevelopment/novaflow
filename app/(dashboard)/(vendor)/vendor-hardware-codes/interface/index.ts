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

export interface HardwareCollection {
  Hardware_Name: string;
  Hardware_Mask_ID: string;
}

export interface Vendor {
  Vendor_Name: string;
  Vendor_ID: string;
  Vendor_Mask_ID?: string;
}

export interface HardwareFormProps {
  hardware?: Hardware | null;
  onClose: () => void;
  onSuccess: () => void;
}
