"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { ChevronDownIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useFetchOrderConfigQuery, usePatchOrderConfigMutation } from "@/store";
import { LoaderThree } from "@/components/ui/loader";
import { toast } from "sonner";
// unified debounce across all fields; per-field debounce removed

interface OrderConfigProps {
  orderId: string;
  orderType: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OrderConfig: React.FC<OrderConfigProps> = ({ orderId, orderType }) => {
  const [gatePass, setGatePass] = useState<string>("");
  const [purchaseOrder, setPurchaseOrder] = useState<string>("");
  const [committedDate, setCommittedDate] = useState<Date | undefined>(
    undefined
  );
  const [taxPercentage, setTaxPercentage] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Track previous sent values to prevent duplicate API calls
  const prevDebouncedValues = useRef({
    gatePass: "",
    purchaseOrder: "",
    committedDate: undefined as Date | undefined,
    taxPercentage: "",
  });

  // Track if data has been initially loaded and initial values
  const hasInitiallyLoaded = useRef(false);
  const initialValues = useRef({
    gatePass: "",
    purchaseOrder: "",
    committedDate: undefined as Date | undefined,
    taxPercentage: "",
  });

  // Fetch order config data
  const {
    data: orderConfigData,
    isLoading,
    isError,
    error,
  } = useFetchOrderConfigQuery({ order_id: orderId }, { skip: !orderId });

  // Mutation for updating order config
  const [patchOrderConfig, { isLoading: isUpdating }] =
    usePatchOrderConfigMutation();

  const updateOrderConfig = useCallback(
    async (updates: {
      gate_pass?: string | null;
      entity_order?: string | null;
      committed_date?: string | null;
      tax_percentage?: number;
    }) => {
      if (!orderId) return;

      try {
        await patchOrderConfig({
          order_id: orderId,
          ...updates,
        }).unwrap();
      } catch (err: any) {
        console.error("Error updating order config:", err);
        toast.error(
          err?.data?.message ||
            "Failed to update order config. Please try again."
        );
      }
    },
    [orderId, patchOrderConfig]
  );

  // Update form fields when data is fetched
  useEffect(() => {
    if (orderConfigData?.data) {
      const config = orderConfigData.data;
      const initialGatePass = config.gate_pass || "";
      const initialPurchaseOrder = config.entity_order || "";
      const initialCommittedDate = config.committed_date
        ? new Date(config.committed_date)
        : undefined;
      const initialTaxPercentage =
        config.tax_percentage !== undefined
          ? String(config.tax_percentage)
          : "";

      setGatePass(initialGatePass);
      setPurchaseOrder(initialPurchaseOrder);
      setCommittedDate(initialCommittedDate);
      setTaxPercentage(initialTaxPercentage);

      // Store initial values for comparison
      initialValues.current = {
        gatePass: initialGatePass,
        purchaseOrder: initialPurchaseOrder,
        committedDate: initialCommittedDate,
        taxPercentage: initialTaxPercentage,
      };

      // Initialize previous debounced values
      prevDebouncedValues.current = {
        gatePass: initialGatePass,
        purchaseOrder: initialPurchaseOrder,
        committedDate: initialCommittedDate,
        taxPercentage: initialTaxPercentage,
      };

      hasInitiallyLoaded.current = true;
    }
  }, [orderConfigData]);

  // Unified debounce across all fields: waits 3s of inactivity, batches changes
  useEffect(() => {
    if (!hasInitiallyLoaded.current) return;

    const timer = setTimeout(() => {
      const updates: {
        gate_pass?: string | null;
        entity_order?: string | null;
        committed_date?: string | null;
        tax_percentage?: number;
      } = {};

      // gate_pass
      if (gatePass !== prevDebouncedValues.current.gatePass) {
        updates.gate_pass = gatePass || null;
      }

      // entity_order
      if (purchaseOrder !== prevDebouncedValues.current.purchaseOrder) {
        updates.entity_order = purchaseOrder || null;
      }

      // committed_date (compare Date by time)
      const prevDate = prevDebouncedValues.current.committedDate;
      const currDate = committedDate;
      const datesEqual =
        (!prevDate && !currDate) ||
        (prevDate && currDate && prevDate.getTime() === currDate.getTime());
      if (!datesEqual) {
        updates.committed_date = currDate ? currDate.toISOString() : null;
      }

      // tax_percentage (string input -> number, keep previous if identical string)
      if (taxPercentage !== prevDebouncedValues.current.taxPercentage) {
        const numeric = taxPercentage.replace(/[^0-9.]/g, "");
        if (numeric === "" || !isNaN(parseFloat(numeric))) {
          updates.tax_percentage = numeric ? parseFloat(numeric) : 0;
        }
      }

      if (Object.keys(updates).length > 0) {
        updateOrderConfig(updates);
        // Update prev values only after successful schedule of updates
        prevDebouncedValues.current = {
          gatePass,
          purchaseOrder,
          committedDate,
          taxPercentage,
        };
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [gatePass, purchaseOrder, committedDate, taxPercentage, updateOrderConfig]);

  // Handle input changes
  const handleGatePassChange = (value: string) => {
    setGatePass(value);
  };

  const handlePurchaseOrderChange = (value: string) => {
    setPurchaseOrder(value);
  };

  const handleCommittedDateChange = (date: Date | undefined) => {
    setCommittedDate(date);
    setCalendarOpen(false);
  };

  const handleTaxPercentageChange = (value: string) => {
    // Only allow numbers and decimals
    const numericValue = value.replace(/[^0-9.]/g, "");
    // Prevent multiple decimal points
    const parts = numericValue.split(".");
    const formattedValue =
      parts.length > 2
        ? parts[0] + "." + parts.slice(1).join("")
        : numericValue;

    setTaxPercentage(formattedValue);
  };

  if (isLoading) {
    return (
      <div className="w-full bg-white flex justify-center items-center">
        <LoaderThree />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full  bg-white">
        <p className="text-red-600">
          Error loading order config:{" "}
          {(error as any)?.data?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-white ">
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
        {/* Gate Pass Field */}
        <div className="flex-1">
          <Label htmlFor="gate-pass" className="mb-2 block">
            Gate Pass
          </Label>
          <Input
            id="gate-pass"
            type="text"
            value={gatePass}
            onChange={(e) => handleGatePassChange(e.target.value)}
            placeholder="Enter gate pass"
            disabled={isUpdating}
            className="w-full"
          />
        </div>

        {/* Purchase Order Field */}
        <div className="flex-1">
          <Label htmlFor="purchase-order" className="mb-2 block">
            Purchase Order
          </Label>
          <Input
            id="purchase-order"
            type="text"
            value={purchaseOrder}
            onChange={(e) => handlePurchaseOrderChange(e.target.value)}
            placeholder="Enter purchase order"
            disabled={isUpdating}
            className="w-full"
          />
        </div>

        {/* Committed Date Field */}
        <div className="flex-1">
          <Label htmlFor="committed-date" className="mb-2 block">
            Committed Date
          </Label>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                id="committed-date"
                variant="outline"
                disabled={isUpdating}
                className="w-full justify-between font-normal"
              >
                {committedDate
                  ? committedDate.toLocaleDateString()
                  : "Select date"}
                <ChevronDownIcon className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              className="w-auto overflow-hidden p-0"
              align="start"
            >
              <Calendar
                mode="single"
                selected={committedDate}
                captionLayout="dropdown"
                onSelect={handleCommittedDateChange}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Tax Percentage Field */}
        <div className="flex-1">
          <Label htmlFor="tax-percentage" className="mb-2 block">
            Tax Percentage
          </Label>
          <Input
            id="tax-percentage"
            type="text"
            inputMode="decimal"
            value={taxPercentage}
            onChange={(e) => handleTaxPercentageChange(e.target.value)}
            placeholder="0.00"
            disabled={isUpdating}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

export default OrderConfig;
