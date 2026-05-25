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
  Customer_ID: string;
  Material: string;
  Width: number;
  Adhesive_Type: string;
  Paper_GSM: number;
  Product_Description: string;
  HS_Code?: string | null;
  Customer_Description?: string | null;
}

export interface ProductFormProps {
  product?: {
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
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}
