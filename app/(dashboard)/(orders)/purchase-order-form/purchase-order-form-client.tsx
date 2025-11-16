"use client";

import { useState, useEffect } from "react";
import OrderConfig from "../components/order-config";
import OrderDetails from "../components/order-header";
import OrderNote from "../components/order-note";
import { OrderItemsTable } from "../components/order-items-table";
import { OrderTransactionsTable } from "../components/order-transactions-table";
import { OrderChargesTable } from "../components/order-charges-table";

interface PurchaseOrderFormClientProps {
  searchParams: {
    Order_ID?: string;
    Order_Type?: string;
  };
}

export default function PurchaseOrderFormClient({
  searchParams,
}: PurchaseOrderFormClientProps) {
  const { Order_ID } = searchParams;
  const orderType = "Purchase";
  const [currentOrderId, setCurrentOrderId] = useState<string | undefined>(
    Order_ID
  );
  const effectiveOrderId = currentOrderId ?? Order_ID;

  // Update currentOrderId when Order_ID from searchParams changes
  useEffect(() => {
    if (Order_ID) {
      setCurrentOrderId(Order_ID);
    }
  }, [Order_ID]);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <OrderDetails
        orderId={Order_ID}
        orderType={orderType}
        onOrderCreated={(orderId) => setCurrentOrderId(orderId)}
      />
      {effectiveOrderId && (
        <>
          <OrderConfig orderId={effectiveOrderId} orderType={orderType} />
          <br />
          <OrderItemsTable orderId={effectiveOrderId} />
          <OrderTransactionsTable orderId={effectiveOrderId} />
          <OrderChargesTable orderId={effectiveOrderId} />
          <br />
          <OrderNote orderId={effectiveOrderId} orderType={orderType} />
        </>
      )}
    </main>
  );
}
