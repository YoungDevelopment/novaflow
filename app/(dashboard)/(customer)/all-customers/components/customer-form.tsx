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
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Customer } from "@/store/endpoints/customer/type";
import { useCreateCustomerMutation, useUpdateCustomerMutation } from "@/store";

interface CustomerFormProps {
  customer: Customer | null;
  isOpen: boolean;
  isUpdate: boolean;
  onClose: () => void;
}

export function CustomerForm({
  customer,
  isOpen,
  isUpdate,
  onClose,
}: CustomerFormProps) {
  const [createCustomer, { isLoading: isCreating }] = useCreateCustomerMutation();
  const [updateCustomer, { isLoading: isUpdating }] = useUpdateCustomerMutation();

  const isLoading = isCreating || isUpdating;

  const [formData, setFormData] = useState({
    customer_name: "",
    customer_mask_id: "",
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
    account_number: "",
    iban_number: "",
    swift_code: "",
    bank_name: "",
    branch_code: "",
    notes: "",
  });

  // Populate form when customer data changes (for update)
  useEffect(() => {
    // Reset success state when form opens
    setSubmitSuccess(false);

    if (isUpdate && customer) {
      setFormData({
        customer_name: customer.Customer_Name || "",
        customer_mask_id: customer.Customer_Mask_ID || "",
        ntn_number: customer.NTN_Number || "",
        strn_number: customer.STRN_Number || "",
        address_line_1: customer.Address_1 || "",
        address_line_2: customer.Address_2 || "",
        city: "",
        province: "",
        postal_code: "",
        contact_person: customer.Contact_Person || "",
        contact_number: customer.Contact_Number || "",
        email: customer.Email_ID || "",
        website: customer.Website || "",
        account_number: customer.Account_Number || "",
        iban_number: customer.IBAN_Number || "",
        swift_code: customer.Swift_Code || "",
        bank_name: customer.Bank_Name || "",
        branch_code: customer.Branch_Code || "",
        notes: customer.Notes || "",
      });
    } else if (!isUpdate) {
      // Reset form for create mode
      setFormData({
        customer_name: "",
        customer_mask_id: "",
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
        account_number: "",
        iban_number: "",
        swift_code: "",
        bank_name: "",
        branch_code: "",
        notes: "",
      });
    }
  }, [customer, isUpdate, isOpen]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.customer_name.trim()) {
      toast.error("Customer Name is required");
      return false;
    }

    if (!formData.customer_mask_id.trim()) {
      toast.error("Customer Mask ID is required");
      return false;
    }

    return true;
  };

  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitSuccess(false);

    try {
      // Transform form data to match API structure
      const customerData = {
        Customer_Name: formData.customer_name.trim(),
        Customer_Mask_ID: formData.customer_mask_id.trim(),
        NTN_Number: formData.ntn_number.trim() || null,
        STRN_Number: formData.strn_number.trim() || null,
        Address_1: formData.address_line_1.trim() || null,
        Address_2: formData.address_line_2.trim() || null,
        Contact_Number: formData.contact_number.trim() || null,
        Contact_Person: formData.contact_person.trim() || null,
        Email_ID: formData.email.trim() || null,
        Website: formData.website.trim() || null,
        Account_Number: formData.account_number.trim() || null,
        IBAN_Number: formData.iban_number.trim() || null,
        Swift_Code: formData.swift_code.trim() || null,
        Bank_Name: formData.bank_name.trim() || null,
        Branch_Code: formData.branch_code.trim() || null,
        Notes: formData.notes.trim() || null,
      };

      if (isUpdate && customer) {
        const result = await updateCustomer({
          ...customerData,
          Customer_ID: customer.Customer_ID,
        }).unwrap();

        toast.success(
          `Customer "${result.Customer_Name}" has been updated successfully`
        );
        setSubmitSuccess(true);

        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        const result = await createCustomer(customerData).unwrap();

        toast.success(
          `Customer "${result.Customer_Name}" created successfully with ID: ${result.Customer_ID}`
        );
        setSubmitSuccess(true);

        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (error: any) {
      console.error(
        `Error ${isUpdate ? "updating" : "creating"} customer:`,
        error
      );

      // Handle different error types
      const errorMessage =
        error?.data?.message || error?.data?.error || "An error occurred";

      toast.error(errorMessage);
    }
  };

  const handleClose = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl p-0 sm:p-0 flex flex-col max-h-[calc(100vh-4rem)]">
        <DialogHeader className="px-4 py-4 sm:px-6 sm:py-6 border-b border-muted">
          <DialogTitle>
            {isUpdate ? "Edit Customer Information" : "Create New Customer"}
          </DialogTitle>
        </DialogHeader>

        <div className="overflow-y-auto flex-1">
          <form onSubmit={handleSubmit} className="space-y-6 p-4 sm:p-6">
            {/* Basic Information Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customer_name">
                    Customer Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customer_name"
                    name="customer_name"
                    placeholder="Enter customer name"
                    value={formData.customer_name}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customer_mask_id">
                    Customer Mask ID <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="customer_mask_id"
                    name="customer_mask_id"
                    placeholder="Enter customer mask ID"
                    value={formData.customer_mask_id}
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

            {/* Bank Details Section */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="account_number">Account Number</Label>
                  <Input
                    id="account_number"
                    name="account_number"
                    placeholder="Enter account number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="iban_number">IBAN Number</Label>
                  <Input
                    id="iban_number"
                    name="iban_number"
                    placeholder="Enter IBAN number"
                    value={formData.iban_number}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="swift_code">Swift Code</Label>
                  <Input
                    id="swift_code"
                    name="swift_code"
                    placeholder="Enter swift code"
                    value={formData.swift_code}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank_name">Bank Name</Label>
                  <Input
                    id="bank_name"
                    name="bank_name"
                    placeholder="Enter bank name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="branch_code">Branch Code</Label>
                  <Input
                    id="branch_code"
                    name="branch_code"
                    placeholder="Enter branch code"
                    value={formData.branch_code}
                    onChange={handleInputChange}
                    className="bg-input text-foreground"
                  />
                </div>
              </div>
            </div>

            {/* Notes Section */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Enter notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  className="bg-input text-foreground"
                />
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
                disabled={isLoading || submitSuccess}
              >
                {isLoading
                  ? isUpdate
                    ? "Updating..."
                    : "Creating..."
                  : submitSuccess
                  ? "✓ Success"
                  : isUpdate
                  ? "Update Customer"
                  : "Create Customer"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
