import PurchaseOrderFormClient from "./purchase-order-form-client";

export default async function PurchaseOrderForm({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolved = await searchParams;

  const orderId = Array.isArray(resolved.Order_ID)
    ? resolved.Order_ID[0]
    : resolved.Order_ID;
  const orderType = Array.isArray(resolved.Order_Type)
    ? resolved.Order_Type[0]
    : resolved.Order_Type;

  return (
    <PurchaseOrderFormClient
      searchParams={{ Order_ID: orderId, Order_Type: orderType }}
    />
  );
}
