"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { VendorFormData, Vendor } from "../interface";
import { useUpdateVendorMutation } from "@/store";

interface EditVendorFormProps {
  vendor: Vendor | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EditVendorForm({
  vendor,
  isOpen,
  onClose,
}: EditVendorFormProps) {
  const [updateVendor, { isLoading }] = useUpdateVendorMutation();

  const [formData, setFormData] = useState<VendorFormData>({
    vendor_name: "",
    vendor_mask_id: "",
    ntn_number: "",
    strn_number: "",
    address_line_1: "",
    address_line_2: "",
    city: "",
    province: "",
    postal_code: "",
    contact_person: "",
    contact_number: "",
    email: "",
    website: "",
  });

  // Populate form when vendor data changes
  useEffect(() => {
    if (vendor) {
      setFormData({
        vendor_name: vendor.Vendor_Name || "",
        vendor_mask_id: vendor.Vendor_Mask_ID || "",
        ntn_number: vendor.NTN_Number || "",
        strn_number: vendor.STRN_Number || "",
        address_line_1: vendor.Address_1 || "",
        address_line_2: vendor.Address_2 || "",
        city: "",
        province: "",
        postal_code: "",
        contact_person: vendor.Contact_Person || "",
        contact_number: vendor.Contact_Number || "",
        email: vendor.Email_ID || "",
        website: vendor.Website || "",
      });
    }
  }, [vendor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.vendor_name.trim()) {
      toast("Validation Error", {
        description: "Vendor Name is required",
      });
      return false;
    }

    if (!formData.vendor_mask_id.trim()) {
      toast("Validation Error", {
        description: "Vendor Mask ID is required",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !vendor) {
      return;
    }

    try {
      // Transform form data to match API structure
      const vendorData = {
        Vendor_ID: vendor.Vendor_ID,
        Vendor_Name: formData.vendor_name.trim(),
        Vendor_Mask_ID: formData.vendor_mask_id.trim(),
        NTN_Number: formData.ntn_number.trim() || null,
        STRN_Number: formData.strn_number.trim() || null,
        Address_1: formData.address_line_1.trim() || null,
        Address_2: formData.address_line_2.trim() || null,
        Contact_Number: formData.contact_number.trim() || null,
        Contact_Person: formData.contact_person.trim() || null,
        Email_ID: formData.email.trim() || null,
        Website: formData.website.trim() || null,
      };

      const result = await updateVendor(vendorData).unwrap();

      toast("Success", {
        description: `Vendor "${result.Vendor_Name}" updated successfully`,
      });

      onClose();
    } catch (error: any) {
      console.error("Error updating vendor:", error);

      // Handle different error types
      if (error?.data?.error === "ValidationError") {
        toast("Validation Error", {
          description:
            error.data.message || "Please check your input and try again",
        });
      } else if (error?.data?.error === "ConflictError") {
        toast("Conflict Error", {
          description:
            error.data.message || "Vendor name or mask ID already exists",
        });
      } else {
        toast("Error", {
          description: "Failed to update vendor. Please try again.",
        });
      }
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl p-0 sm:p-0 flex flex-col max-h-[calc(100vh-4rem)]">
        <DialogHeader className="px-4 py-4 sm:px-6 sm:py-6 border-b border-muted">
          <DialogTitle>Edit Vendor Information</DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="vendor_name">
                    Vendor Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendor_name"
                    name="vendor_name"
                    placeholder="Enter vendor name"
                    value={formData.vendor_name}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="vendor_mask_id">
                    Vendor Mask ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="vendor_mask_id"
                    name="vendor_mask_id"
                    placeholder="Enter vendor mask ID"
                    value={formData.vendor_mask_id}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="ntn_number">NTN Number</Label>
                  <Input
                    id="ntn_number"
                    name="ntn_number"
                    placeholder="Enter NTN number"
                    value={formData.ntn_number}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="strn_number">STRN Number</Label>
                  <Input
                    id="strn_number"
                    name="strn_number"
                    placeholder="Enter STRN number"
                    value={formData.strn_number}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="address_line_1">Address Line 1</Label>
                  <Input
                    id="address_line_1"
                    name="address_line_1"
                    placeholder="Enter address line 1"
                    value={formData.address_line_1}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address_line_2">Address Line 2</Label>
                  <Input
                    id="address_line_2"
                    name="address_line_2"
                    placeholder="Enter address line 2"
                    value={formData.address_line_2}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      placeholder="Enter city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="bg-input text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="province">Province</Label>
                    <Input
                      id="province"
                      name="province"
                      placeholder="Enter province"
                      value={formData.province}
                      onChange={handleInputChange}
                      className="bg-input text-foreground"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postal_code">Postal Code</Label>
                    <Input
                      id="postal_code"
                      name="postal_code"
                      placeholder="Enter postal code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      className="bg-input text-foreground"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-8">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="contact_person">Contact Person</Label>
                  <Input
                    id="contact_person"
                    name="contact_person"
                    placeholder="Enter contact person name"
                    value={formData.contact_person}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_number">Contact Number</Label>
                  <Input
                    id="contact_number"
                    name="contact_number"
                    placeholder="Enter contact number"
                    value={formData.contact_number}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Enter email address"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    name="website"
                    placeholder="Enter website URL"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end pt-4 border-t border-muted">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                className="w-full md:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full md:w-auto"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Update Vendor"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

