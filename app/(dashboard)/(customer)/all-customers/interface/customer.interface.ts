import { Customer } from "@/store/endpoints/customer/type";

export interface CustomerTableProps {
  onEdit?: (customer: Customer) => void;
  onDelete?: (customer: Customer) => void;
  onCreate?: () => void;
}
