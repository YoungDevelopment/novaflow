"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  useCreateOrderChargeMutation,
  useUpdateOrderChargeMutation,
} from "@/store";
import type { OrderCharge } from "@/store/endpoints/orderCharges/type";

interface OrderChargesFormProps {
  orderId: string;
  charge?: OrderCharge | null;
  onSuccess?: () => void;
}

export default function OrderChargesForm({
  orderId,
  charge,
  onSuccess,
}: OrderChargesFormProps) {
  const isEditing = useMemo(() => Boolean(charge), [charge]);
  const [description, setDescription] = useState<string>("");
  const [charges, setCharges] = useState<string>("0");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [createCharge] = useCreateOrderChargeMutation();
  const [updateCharge] = useUpdateOrderChargeMutation();

  useEffect(() => {
    if (charge) {
      setDescription(charge.Description || "");
      setCharges(String(charge.Charges ?? "0"));
    } else {
      setDescription("");
      setCharges("0");
    }
  }, [charge]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Description is required");
      return;
    }
    const chargesNum = Number(charges);
    if (!Number.isFinite(chargesNum) || chargesNum < 0) {
      toast.error("Charges must be a non-negative number");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing && charge) {
        await updateCharge({
          Order_Charges_ID: charge.Order_Charges_ID,
          Order_ID: orderId,
          Description: description.trim(),
          Charges: chargesNum,
        }).unwrap();
        toast.success("Order charge updated successfully");
      } else {
        await createCharge({
          Order_ID: orderId,
          Description: description.trim(),
          Charges: chargesNum,
        }).unwrap();
        toast.success("Order charge created successfully");
        setDescription("");
        setCharges("0");
      }
      onSuccess?.();
    } catch (error: any) {
      console.error("Order charge submit error:", error);
      toast.error(error?.data?.message || "Failed to submit order charge");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="charge-description">Description *</Label>
        <Input
          id="charge-description"
          type="text"
          placeholder="Enter description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="charge-amount">Charges *</Label>
        <Input
          id="charge-amount"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={charges}
          onChange={(e) => setCharges(e.target.value)}
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isEditing ? "Updating..." : "Adding..."}
          </>
        ) : isEditing ? (
          "Update Charge"
        ) : (
          "Add Charge"
        )}
      </Button>
    </form>
  );
}


