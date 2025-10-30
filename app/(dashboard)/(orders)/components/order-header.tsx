"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LoaderThree } from "@/components/ui/loader";
import {
  useFetchOrderHeaderByIdQuery,
  useCreateOrderHeaderMutation,
} from "@/store/endpoints/orderHeader";
import { useFetchVendorsQuery } from "@/store/endpoints/vendor";
import { OrderHeader } from "@/store/endpoints/orderHeader/type";

interface OrderDetailsProps {
  orderId?: string;
  orderType?: string;
  onOrderCreated?: (orderId: string) => void;
}

export default function OrderDetails({
  orderId,
  orderType = "Purchase",
  onOrderCreated,
}: OrderDetailsProps) {
  const { user } = useUser();
  const [selectedVendor, setSelectedVendor] = useState<string>("");
  const [isOrderCreated, setIsOrderCreated] = useState(false);
  const [createdOrderData, setCreatedOrderData] = useState<OrderHeader | null>(
    null
  );

  // Fetch vendors
  const { data: vendorsData, isLoading: vendorsLoading } = useFetchVendorsQuery(
    { limit: 100 }
  );
  const vendors = vendorsData?.data || [];

  // Fetch order data if orderId is provided
  const { data: orderDataResponse, isLoading: orderLoading } =
    useFetchOrderHeaderByIdQuery({ order_id: orderId! }, { skip: !orderId });

  const orderData = orderDataResponse?.data || createdOrderData;

  // Create order mutation
  const [createOrder, { isLoading: creating }] = useCreateOrderHeaderMutation();

  // Update selected vendor when order data is loaded
  useEffect(() => {
    if (orderData) {
      setSelectedVendor(orderData.entity_id);
      setIsOrderCreated(true);
      // Notify parent component about the fetched order ID
      if (orderData.order_id && onOrderCreated) {
        onOrderCreated(orderData.order_id);
      }
    } else if (orderId) {
      // Order ID provided but no order found
      setIsOrderCreated(false);
    }
  }, [orderData, orderId, onOrderCreated]);

  const handleCreateOrder = async () => {
    if (!selectedVendor || !user?.username) return;

    try {
      const response = await createOrder({
        user: user.username,
        type: orderType,
        status: "Incomplete",
        entity_id: selectedVendor,
        total_due: 0,
      }).unwrap();

      if (response) {
        setCreatedOrderData(response);
        setIsOrderCreated(true);
        // Notify parent component about the created order ID
        if (response.order_id && onOrderCreated) {
          onOrderCreated(response.order_id);
        }
      }
    } catch (error) {
      console.error("Error creating order:", error);
    }
  };

  const isCreateButtonDisabled = !selectedVendor || !user?.username || creating;
  const loading = orderLoading || vendorsLoading;

  if (loading && orderId) {
    return (
      <div className="w-full p-8 bg-white flex justify-center items-center">
        <LoaderThree />
      </div>
    );
  }

  return (
    <div className="w-full  bg-white">
      {/* Main Content Container */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-8">
        {/* Left Column */}
        <div className="flex-1 leading-3">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-4 lg:mb-6">
            Order ID: {orderData?.order_id || "New Order"}
          </h1>

          {/* Status */}
          <div className="mb-6 lg:mb-8">
            <p className="font-bold text-slate-900 leading-3 text-lg sm:text-xl lg:text-2xl">
              Status: {orderData?.status || "Incomplete"}
            </p>
          </div>

          {/* Vendor Field */}
          <div className="mb-4 lg:mb-6 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <label className="block text-base sm:text-lg font-semibold text-slate-900 leading-4 mb-0">
              Vendor:
            </label>
            {isOrderCreated ? (
              <div className="border border-gray-300 rounded-sm p-1 bg-gray-50 text-slate-700 text-sm sm:text-base">
                {vendors.find((v) => v.Vendor_ID === selectedVendor)
                  ?.Vendor_Name || "Unknown Vendor"}
              </div>
            ) : (
              <Select value={selectedVendor} onValueChange={setSelectedVendor}>
                <SelectTrigger className="w-full sm:w-[250px] lg:w-[300px]">
                  <SelectValue placeholder="Select a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.Vendor_ID} value={vendor.Vendor_ID}>
                      {vendor.Vendor_Name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="flex-1 lg:text-right leading-3">
          {isOrderCreated ? (
            <>
              {/* Created By */}
              <div className="mb-3 lg:mb-4">
                <p className="text-slate-600 leading-3 text-xs sm:text-sm">
                  Created by:{" "}
                  <span className="font-semibold text-slate-900">
                    {orderData?.user || user?.username}
                  </span>
                </p>
              </div>

              {/* Created Date */}
              <div className="mb-3 lg:mb-4">
                <p className="text-slate-600 text-xs">
                  Created Date:{" "}
                  <span className="font-semibold text-slate-900">
                    {orderData?.created_at
                      ? new Date(orderData.created_at).toLocaleDateString(
                          "en-GB"
                        ) +
                        " " +
                        new Date(orderData.created_at).toLocaleTimeString(
                          "en-GB",
                          { hour: "2-digit", minute: "2-digit" }
                        )
                      : "N/A"}
                  </span>
                </p>
              </div>
            </>
          ) : (
            <div className="mb-6 lg:mb-8">
              <Button
                onClick={handleCreateOrder}
                disabled={isCreateButtonDisabled}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 text-sm sm:text-base"
              >
                {creating ? "Creating..." : "Create Order"}
              </Button>
            </div>
          )}

          {/* Type */}
          <div className="mb-4 lg:mb-6">
            <p className="text-slate-600 text-xs">
              Type:{" "}
              <span className="font-semibold text-slate-900">
                {orderData?.type || orderType}
              </span>
            </p>
          </div>

          {/* Amount */}
          <div>
            <p className="font-bold text-slate-900 text-xl sm:text-2xl lg:text-3xl my-[7px]">
              Amount: ${orderData?.total_due || 0}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
