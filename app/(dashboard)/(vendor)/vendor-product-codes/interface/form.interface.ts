export interface Material {
  Material_Name: string;
  Material_Mask_ID: string;
}

export interface Adhesive {
  Adhesive_Name: string;
  Adhesive_Mask_ID: string;
}

export interface ProductFormData {
  Product_Code?: string;
  Vendor_ID: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
}

export interface ProductFormProps {
  product?: {
    Product_Code: string;
    Vendor_ID: string;
    Vendor_Name: string;
    Material: string;
    Width: number;
    Adhesive_Type: string;
    Paper_GSM: number;
    Product_Description: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}
