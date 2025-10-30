"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useFetchOrderNoteQuery, useUpdateOrderNoteMutation } from "@/store";
import { LoaderThree } from "@/components/ui/loader";

interface OrderNoteProps {
  orderId: string;
  orderType: string;
}

const OrderNote: React.FC<OrderNoteProps> = ({ orderId }) => {
  const [note, setNote] = useState<string>("");
  const [orderNoteId, setOrderNoteId] = useState<string>("");
  const [isTextareaFocused, setIsTextareaFocused] = useState(false);

  const prevNoteRef = useRef<string>("");
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitiallyLoaded = useRef(false);

  const {
    data: orderNoteData,
    isLoading,
    isError,
    error,
    refetch,
  } = useFetchOrderNoteQuery({ order_id: orderId }, { skip: !orderId });

  const [updateOrderNote, { isLoading: isUpdating }] =
    useUpdateOrderNoteMutation();

  useEffect(() => {
    if (!orderId) return;
    refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  useEffect(() => {
    const data = orderNoteData?.data;
    if (data) {
      setOrderNoteId(data.order_note_id);
      setNote(data.note || "");
      prevNoteRef.current = data.note || "";
      hasInitiallyLoaded.current = true;
    }
  }, [orderNoteData]);

  const scheduleSave = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(async () => {
      if (!hasInitiallyLoaded.current) return;
      if (!orderNoteId) return;

      const current = note;
      const previous = prevNoteRef.current;
      if (current === previous) return;

      try {
        const payload = {
          order_note_id: orderNoteId,
          note: current === "" ? null : current,
        };
        await updateOrderNote(payload).unwrap();
        prevNoteRef.current = current;
      } catch (err: any) {
        console.error("Failed to save note", err);
        toast.error(
          err?.data?.message || "Failed to save note. Please try again."
        );
      }
    }, 3000);
  }, [note, orderNoteId, updateOrderNote]);

  useEffect(() => {
    if (!hasInitiallyLoaded.current) return;
    scheduleSave();
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [note, scheduleSave]);

  if (isLoading) {
    return (
      <div className="w-full bg-white flex justify-center items-center">
        <LoaderThree />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full bg-white">
        <p className="text-red-600">
          Error loading order note:{" "}
          {(error as any)?.data?.message || "Unknown error"}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full pt-4 bg-white ">
      <div className="flex flex-col gap-2">
        <Label htmlFor="order-note" className="mb-1 block">
          Notes
        </Label>
        <Textarea
          id="order-note"
          value={note}
          onFocus={() => setIsTextareaFocused(true)}
          onBlur={() => setIsTextareaFocused(false)}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
            setNote(e.target.value)
          }
          disabled={isUpdating}
          placeholder="Type your notes here..."
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
};

export default OrderNote;
