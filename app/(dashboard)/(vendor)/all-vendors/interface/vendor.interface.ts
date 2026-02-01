import { Vendor } from "@/store/endpoints/vendor/type";

export interface VendorTableProps {
  onEdit?: (vendor: Vendor) => void;
  onDelete?: (vendor: Vendor) => void;
  onCreate?: () => void;
}
