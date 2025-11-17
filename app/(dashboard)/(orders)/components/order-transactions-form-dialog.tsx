"use client";

import React, { useState, useEffect } from "react";
import { Loader2, CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  useCreateOrderTransactionMutation,
  useUpdateOrderTransactionMutation,
} from "@/store/endpoints/orderTransactions";
import type { OrderTransaction } from "@/store/endpoints/orderTransactions/type";

interface OrderTransactionFormProps {
  orderId: string;
  transaction?: OrderTransaction | null;
  orderType?: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  Transaction_Date: string;
  Type: string;
  Order_Payment_Type: string;
  Payment_Method: string;
  Actual_Amount: string;
  Decalred_Amount: string;
  Notes: string;
}

const initialFormState: FormState = {
  Transaction_Date: "",
  Type: "",
  Order_Payment_Type: "",
  Payment_Method: "",
  Actual_Amount: "",
  Decalred_Amount: "",
  Notes: "",
};

const PAYMENT_TYPES = ["GST", "Cash"];
const PAYMENT_METHODS = ["Bank Transfer", "Cheque", "In Hand"];

export function OrderTransactionForm({
  orderId,
  transaction,
  orderType = "Purchase",
  onClose,
  onSuccess,
}: OrderTransactionFormProps) {
  const isUpdate = !!transaction;
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isPaymentTypeDropdownOpen, setIsPaymentTypeDropdownOpen] =
    useState(false);
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
  const [isPaymentMethodDropdownOpen, setIsPaymentMethodDropdownOpen] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get Type options based on orderType
  const getTypeOptions = () => {
    if (orderType === "Purchase") {
      return ["Purchase"];
    }
    return ["Purchase"]; // Default for now
  };

  const typeOptions = getTypeOptions();

  const [createTransaction] = useCreateOrderTransactionMutation();
  const [updateTransaction] = useUpdateOrderTransactionMutation();

  // Initialize form with transaction data if updating
  useEffect(() => {
    if (transaction) {
      const dateValue = transaction.Transaction_Date
        ? new Date(transaction.Transaction_Date)
        : undefined;
      setSelectedDate(dateValue);
      setFormState({
        Transaction_Date: transaction.Transaction_Date || "",
        Type: transaction.Type || "",
        Order_Payment_Type: transaction.Order_Payment_Type || "",
        Payment_Method: transaction.Payment_Method || "",
        Actual_Amount:
          transaction.Actual_Amount !== null &&
          transaction.Actual_Amount !== undefined &&
          transaction.Actual_Amount !== 0
            ? String(transaction.Actual_Amount)
            : "",
        Decalred_Amount:
          transaction.Decalred_Amount !== null &&
          transaction.Decalred_Amount !== undefined &&
          transaction.Decalred_Amount !== 0
            ? String(transaction.Decalred_Amount)
            : "",
        Notes: transaction.Notes || "",
      });
    } else {
      setFormState(initialFormState);
      setSelectedDate(undefined);
    }
  }, [transaction]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    if (date) {
      setFormState((prev) => ({
        ...prev,
        Transaction_Date: format(date, "yyyy-MM-dd"),
      }));
    } else {
      setFormState((prev) => ({
        ...prev,
        Transaction_Date: "",
      }));
    }
  };

  const validateForm = (): boolean => {
    if (!formState.Actual_Amount || parseFloat(formState.Actual_Amount) < 0) {
      toast.error("Actual Amount is required and must be a valid number");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        Order_ID: orderId,
        Transaction_Date: formState.Transaction_Date || undefined,
        Type: formState.Type || undefined,
        Order_Payment_Type: formState.Order_Payment_Type || undefined,
        Payment_Method: formState.Payment_Method || undefined,
        Actual_Amount: parseFloat(formState.Actual_Amount) || 0,
        Decalred_Amount: formState.Decalred_Amount
          ? parseFloat(formState.Decalred_Amount)
          : undefined,
        Notes: formState.Notes || undefined,
      };

      if (isUpdate && transaction) {
        await updateTransaction({
          Order_Transcation_ID: transaction.Order_Transcation_ID,
          ...payload,
        }).unwrap();
        toast.success("Transaction updated successfully");
      } else {
        await createTransaction(payload).unwrap();
        toast.success("Transaction created successfully");
      }

      onSuccess();
    } catch (error: any) {
      console.error("Error saving transaction:", error);
      toast.error(
        error?.data?.message ||
          `Failed to ${isUpdate ? "update" : "create"} transaction. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-2xl max-h-[90vh] overflow-y-auto p-0 sm:p-0">
        <DialogHeader className="px-4 py-4 sm:px-6 border-b border-muted sticky top-0 bg-background z-10">
          <DialogTitle>
            {isUpdate ? "Update Transaction" : "Create Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 space-y-4">
          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transaction-date">Transaction Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal bg-transparent"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "PPP")
                  ) : (
                    <span className="text-muted-foreground">
                      Pick a date
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <DropdownMenu
              open={isTypeDropdownOpen}
              onOpenChange={setIsTypeDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {formState.Type || "Select Type"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {typeOptions.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        Type: type,
                      }));
                      setIsTypeDropdownOpen(false);
                    }}
                    className={
                      formState.Type === type ? "bg-accent" : ""
                    }
                  >
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Payment Type Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="payment-type">Payment Type</Label>
            <DropdownMenu
              open={isPaymentTypeDropdownOpen}
              onOpenChange={setIsPaymentTypeDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {formState.Order_Payment_Type || "Select Payment Type"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {PAYMENT_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type}
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        Order_Payment_Type: type,
                      }));
                      setIsPaymentTypeDropdownOpen(false);
                    }}
                    className={
                      formState.Order_Payment_Type === type ? "bg-accent" : ""
                    }
                  >
                    {type}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Payment Method Dropdown */}
          <div className="space-y-2">
            <Label htmlFor="payment-method">Payment Method</Label>
            <DropdownMenu
              open={isPaymentMethodDropdownOpen}
              onOpenChange={setIsPaymentMethodDropdownOpen}
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {formState.Payment_Method || "Select Payment Method"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {PAYMENT_METHODS.map((method) => (
                  <DropdownMenuItem
                    key={method}
                    onClick={() => {
                      setFormState((prev) => ({
                        ...prev,
                        Payment_Method: method,
                      }));
                      setIsPaymentMethodDropdownOpen(false);
                    }}
                    className={
                      formState.Payment_Method === method ? "bg-accent" : ""
                    }
                  >
                    {method}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Amounts - Two Columns */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="actual-amount">
                Actual Amount <span className="text-destructive">*</span>
              </Label>
              <Input
                id="actual-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formState.Actual_Amount}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    Actual_Amount: e.target.value,
                  }))
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="declared-amount">Declared Amount</Label>
              <Input
                id="declared-amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formState.Decalred_Amount}
                onChange={(e) =>
                  setFormState((prev) => ({
                    ...prev,
                    Decalred_Amount: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Enter notes (optional)"
              value={formState.Notes}
              onChange={(e) =>
                setFormState((prev) => ({ ...prev, Notes: e.target.value }))
              }
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex flex-col-reverse gap-3 md:flex-row md:justify-end pt-4 border-t border-muted">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="w-full md:w-auto"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isUpdate ? "Updating..." : "Creating..."}
                </>
              ) : (
                isUpdate ? "Update Transaction" : "Create Transaction"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

