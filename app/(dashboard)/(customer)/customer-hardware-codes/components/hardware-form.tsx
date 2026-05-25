"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Customer, HardwareCollection, HardwareFormProps } from "../interface";
import { CompactLoader } from "@/app/(dashboard)/components";
import {
  useCreateCustomerHardwareMutation,
  useUpdateCustomerHardwareMutation,
  useFetchCustomerNamesQuery,
} from "@/store";
import { getApiUrl } from "@/lib/api-config";

export function HardwareForm({
  hardware,
  onClose,
  onSuccess,
}: HardwareFormProps) {
  const [hardwareCollections, setHardwareCollections] = React.useState<
    HardwareCollection[]
  >([]);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // RTK Query hooks
  const { data: customersData, isLoading: customersLoading } =
    useFetchCustomerNamesQuery();
  const [createHardware] = useCreateCustomerHardwareMutation();
  const [updateHardware] = useUpdateCustomerHardwareMutation();

  // Reset success state when form unmounts or hardware changes
  React.useEffect(() => {
    setSubmitSuccess(false);
  }, [hardware]);

  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(
    null
  );
  const [selectedHardware, setSelectedHardware] =
    React.useState<HardwareCollection | null>(null);
  const [hardwareDescription, setHardwareDescription] =
    React.useState<string>("");
  const [hsCode, setHsCode] = React.useState<string>("");
  const [customerDescription, setCustomerDescription] =
    React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const isUpdate = !!hardware;

  // Extract customers from RTK Query
  const customers = React.useMemo(() => customersData?.data || [], [customersData]);

  // Fetch hardware collection on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const hardwareRes = await fetch(
          getApiUrl("/collection/fetch-all-hardware")
        );

        if (!hardwareRes.ok) {
          throw new Error("Failed to fetch hardware collection");
        }

        const hardwareData = await hardwareRes.json();

        setHardwareCollections(hardwareData.data || []);
      } catch (error) {
        console.error("Error fetching hardware collection:", error);
        toast.error("Failed to load hardware data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  // Pre-fill form when hardware or customers data changes
  React.useEffect(() => {
    if (hardware && customers.length > 0 && hardwareCollections.length > 0) {
      const customer = customers.find(
        (v: Customer) => v.Customer_ID === hardware.Customer_ID
      );

      const hardwareItem = hardwareCollections.find(
        (h: HardwareCollection) => h.Hardware_Name === hardware.Hardware_Name
      );

      setSelectedCustomer(customer || null);
      setSelectedHardware(hardwareItem || null);
      setHardwareDescription(hardware.Hardware_Description);
      setHsCode(hardware.HS_Code || "");
      setCustomerDescription(hardware.Customer_Description || "");
    }
  }, [hardware, customers, hardwareCollections]);

  // Generate hardware code description
  const generateHardwareCodeDescription = () => {
    if (!selectedHardware || !hardwareDescription || !selectedCustomer) {
      return "";
    }
    // Format: Hardware_Mask_ID-Description-Customer_Mask_ID
    return `${selectedHardware.Hardware_Mask_ID}-${hardwareDescription}-${
      selectedCustomer.Customer_Mask_ID || selectedCustomer.Customer_ID
    }`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedCustomer || !selectedHardware || !hardwareDescription) {
      toast.error("Please fill in all required fields");
      return;
    }

    const hardwareCodeDesc = generateHardwareCodeDescription();

    setIsLoading(true);
    setSubmitSuccess(false);

    try {
      if (isUpdate) {
        const updatePayload = {
          Hardware_Code: hardware.Hardware_Code,
          Customer_ID: selectedCustomer.Customer_ID,
          Hardware_Name: selectedHardware.Hardware_Name,
          Hardware_Description: hardwareDescription,
          Hardware_Code_Description: hardwareCodeDesc,
          HS_Code: hsCode.trim() || null,
          Customer_Description: customerDescription.trim() || null,
        };
        await updateHardware(updatePayload).unwrap();
        toast.success("Hardware has been updated successfully");
        setSubmitSuccess(true);

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        const createPayload = {
          Customer_ID: selectedCustomer.Customer_ID,
          Hardware_Name: selectedHardware.Hardware_Name,
          Hardware_Description: hardwareDescription,
          Hardware_Code_Description: hardwareCodeDesc,
          HS_Code: hsCode.trim() || null,
          Customer_Description: customerDescription.trim() || null,
        };
        await createHardware(createPayload).unwrap();
        toast.success("Hardware has been created successfully");
        setSubmitSuccess(true);

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      }
    } catch (error: any) {
      console.error("Error submitting form:", error);

      const errorMessage =
        error?.data?.message ||
        error?.data?.error ||
        `Failed to ${isUpdate ? "update" : "create"} hardware`;

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoadingData || customersLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-background rounded-lg p-6 max-w-md w-full mx-4 flex items-center justify-center gap-2">
          <CompactLoader />
          <span>Loading form data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg shadow-lg max-w-md w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {isUpdate ? "Update Hardware" : "Create New Hardware"}
          </h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <form
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto p-6 space-y-4"
        >
          {/* Customer Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Customer *</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {selectedCustomer?.Customer_Name || "Select Customer"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {customers.map((customer) => (
                  <DropdownMenuItem
                    key={customer.Customer_ID}
                    onClick={() => setSelectedCustomer(customer)}
                    className={
                      selectedCustomer?.Customer_ID === customer.Customer_ID
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {customer.Customer_Name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hardware Name Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Hardware Name *</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {selectedHardware?.Hardware_Name || "Select Hardware"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {hardwareCollections.map((hardwareItem) => (
                  <DropdownMenuItem
                    key={hardwareItem.Hardware_Mask_ID}
                    onClick={() => setSelectedHardware(hardwareItem)}
                    className={
                      selectedHardware?.Hardware_Mask_ID ===
                      hardwareItem.Hardware_Mask_ID
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {hardwareItem.Hardware_Name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Hardware Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Hardware Description *
            </label>
            <Input
              type="text"
              placeholder="Enter hardware description"
              value={hardwareDescription}
              onChange={(e) => setHardwareDescription(e.target.value)}
            />
          </div>

          {/* HS Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">HS Code</label>
            <Input
              type="text"
              placeholder="Enter HS code"
              value={hsCode}
              onChange={(e) => setHsCode(e.target.value)}
            />
          </div>

          {/* Customer Description Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Customer Description
            </label>
            <Textarea
              placeholder="Enter customer description"
              value={customerDescription}
              onChange={(e) => setCustomerDescription(e.target.value)}
            />
          </div>

          {/* Hardware Code Description (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Hardware Code Description
            </label>
            <Input
              type="text"
              value={generateHardwareCodeDescription()}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated: Hardware-Hardware_Description-Customer
            </p>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 bg-transparent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || submitSuccess}
            className="flex-1 gap-2"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading
              ? isUpdate
                ? "Updating..."
                : "Creating..."
              : submitSuccess
              ? "✓ Success"
              : isUpdate
              ? "Update Hardware"
              : "Create Hardware"}
          </Button>
        </div>
      </div>
    </div>
  );
}
