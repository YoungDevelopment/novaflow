"use client";

import * as React from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Vendor, HardwareCollection, HardwareFormProps } from "../interface";
import { CompactLoader } from "@/app/(dashboard)/components";
import {
  useCreateHardwareMutation,
  useUpdateHardwareMutation,
  useFetchVendorNamesQuery,
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
  const { data: vendorsData, isLoading: vendorsLoading } =
    useFetchVendorNamesQuery();
  const [createHardware] = useCreateHardwareMutation();
  const [updateHardware] = useUpdateHardwareMutation();

  // Reset success state when form unmounts or hardware changes
  React.useEffect(() => {
    setSubmitSuccess(false);
  }, [hardware]);

  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(
    null
  );
  const [selectedHardware, setSelectedHardware] =
    React.useState<HardwareCollection | null>(null);
  const [hardwareDescription, setHardwareDescription] =
    React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const isUpdate = !!hardware;

  // Extract vendors from RTK Query
  const vendors = React.useMemo(() => vendorsData?.data || [], [vendorsData]);

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

  // Pre-fill form when hardware or vendors data changes
  React.useEffect(() => {
    if (hardware && vendors.length > 0 && hardwareCollections.length > 0) {
      const vendor = vendors.find(
        (v: Vendor) => v.Vendor_ID === hardware.Vendor_ID
      );

      const hardwareItem = hardwareCollections.find(
        (h: HardwareCollection) => h.Hardware_Name === hardware.Hardware_Name
      );

      setSelectedVendor(vendor || null);
      setSelectedHardware(hardwareItem || null);
      setHardwareDescription(hardware.Hardware_Description);
    }
  }, [hardware, vendors, hardwareCollections]);

  // Generate hardware code description
  const generateHardwareCodeDescription = () => {
    if (!selectedHardware || !hardwareDescription || !selectedVendor) {
      return "";
    }
    // Format: Hardware_Mask_ID-Description-Vendor_Mask_ID
    return `${selectedHardware.Hardware_Mask_ID}-${hardwareDescription}-${
      selectedVendor.Vendor_Mask_ID || selectedVendor.Vendor_ID
    }`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!selectedVendor || !selectedHardware || !hardwareDescription) {
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
          Vendor_ID: selectedVendor.Vendor_ID,
          Hardware_Name: selectedHardware.Hardware_Name,
          Hardware_Description: hardwareDescription,
          Hardware_Code_Description: hardwareCodeDesc,
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
          Vendor_ID: selectedVendor.Vendor_ID,
          Hardware_Name: selectedHardware.Hardware_Name,
          Hardware_Description: hardwareDescription,
          Hardware_Code_Description: hardwareCodeDesc,
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

  if (isLoadingData || vendorsLoading) {
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
          {/* Vendor Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Vendor *</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {selectedVendor?.Vendor_Name || "Select Vendor"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {vendors.map((vendor) => (
                  <DropdownMenuItem
                    key={vendor.Vendor_ID}
                    onClick={() => setSelectedVendor(vendor)}
                    className={
                      selectedVendor?.Vendor_ID === vendor.Vendor_ID
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {vendor.Vendor_Name}
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
              Auto-generated: Hardware-Hardware_Description-Vendor
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
