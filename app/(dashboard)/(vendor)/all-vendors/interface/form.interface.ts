export interface VendorFormData {
  vendor_name: string;
  vendor_mask_id: string;
  ntn_number: string;
  strn_number: string;
  address_line_1: string;
  address_line_2: string;
  city: string;
  province: string;
  postal_code: string;
  contact_person: string;
  contact_number: string;
  email: string;
  website: string;
  account_number: string;
  iban_number: string;
  swift_code: string;
  bank_name: string;
  branch_code: string;
}

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
  Account_Number?: string;
  IBAN_Number?: string;
  Swift_Code?: string;
  Bank_Name?: string;
  Branch_Code?: string;
}
