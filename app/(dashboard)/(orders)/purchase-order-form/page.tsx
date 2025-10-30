import PurchaseOrderFormClient from "./purchase-order-form-client";

export default function PurchaseOrderForm({
  searchParams,
}: {
  searchParams: { Order_ID?: string; Order_Type?: string };
}) {
  return (
    <PurchaseOrderFormClient
      searchParams={searchParams as { Order_ID?: string; Order_Type?: string }}
    />
  );
}
