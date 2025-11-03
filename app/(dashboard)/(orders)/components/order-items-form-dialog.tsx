"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { CompactLoader } from "@/app/(dashboard)/components";
import {
  useCreateOrderItemMutation,
  useUpdateOrderItemMutation,
} from "@/store";
import { useFetchHardwareQuery } from "@/store/endpoints/vendorHardware";
import { useFetchProductsQuery } from "@/store/endpoints/vendorProducts";
import type { Hardware } from "@/store/endpoints/vendorHardware/type";
import type { Product } from "@/store/endpoints/vendorProducts/type";
import type { OrderItem } from "@/store/endpoints/orderItems/type";

interface OrderItemFormProps {
  orderId: string;
  vendorId: string;
  orderItem?: OrderItem | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  vendorId: string;
  selectedItem: Hardware | Product | null;
  description: string;
  unit: string;
  kg: string;
  declaredPricePerUnit: string;
  declaredPricePerKg: string;
  actualPricePerUnit: string;
  actualPricePerKg: string;
  declaredAmount: string;
  actualAmount: string;
  movement: boolean;
}

const initialFormState: FormState = {
  vendorId: "",
  selectedItem: null,
  description: "",
  unit: "",
  kg: "",
  declaredPricePerUnit: "",
  declaredPricePerKg: "",
  actualPricePerUnit: "",
  actualPricePerKg: "",
  declaredAmount: "",
  actualAmount: "",
  movement: false,
};

export function OrderItemForm({
  orderId,
  vendorId,
  orderItem,
  onClose,
  onSuccess,
}: OrderItemFormProps) {
  const isUpdate = !!orderItem;
  const [activeTab, setActiveTab] = useState<"hardware" | "product">(
    orderItem?.item_type === "Product" ? "product" : "hardware"
  );
  const [hardwareForm, setHardwareForm] = useState<FormState>({
    ...initialFormState,
    vendorId,
  });
  const [productForm, setProductForm] = useState<FormState>({
    ...initialFormState,
    vendorId,
  });
  const [hardwareSearch, setHardwareSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isHardwareDropdownOpen, setIsHardwareDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track if amounts are manually edited to allow override
  const [hardwareAmountsManuallyEdited, setHardwareAmountsManuallyEdited] =
    useState({
      declared: false,
      actual: false,
    });
  const [productAmountsManuallyEdited, setProductAmountsManuallyEdited] =
    useState({
      declared: false,
      actual: false,
    });

  // Helper function to calculate amounts (based on Unit only, not KG)
  const calculateAmount = (pricePerUnit: string, unit: string): string => {
    // If either field is empty, return empty string to show placeholder
    if (!pricePerUnit.trim() || !unit.trim()) {
      return "";
    }

    const priceUnit = parseFloat(pricePerUnit) || 0;
    const unitValue = parseFloat(unit) || 0;

    const result = priceUnit * unitValue;
    // Return empty string if result is 0, otherwise return formatted value
    return result === 0 ? "" : result.toFixed(2);
  };

  // Auto-calculate hardware amounts (based on Unit only)
  useEffect(() => {
    if (hardwareAmountsManuallyEdited.declared) {
      return; // Don't auto-calculate if manually edited
    }
    const calculated = calculateAmount(
      hardwareForm.declaredPricePerUnit,
      hardwareForm.unit
    );
    setHardwareForm((prev) => ({
      ...prev,
      declaredAmount: calculated,
    }));
  }, [
    hardwareForm.declaredPricePerUnit,
    hardwareForm.unit,
    hardwareAmountsManuallyEdited.declared,
  ]);

  useEffect(() => {
    if (hardwareAmountsManuallyEdited.actual) {
      return; // Don't auto-calculate if manually edited
    }
    const calculated = calculateAmount(
      hardwareForm.actualPricePerUnit,
      hardwareForm.unit
    );
    setHardwareForm((prev) => ({
      ...prev,
      actualAmount: calculated,
    }));
  }, [
    hardwareForm.actualPricePerUnit,
    hardwareForm.unit,
    hardwareAmountsManuallyEdited.actual,
  ]);

  // Auto-calculate product amounts (based on Unit only)
  useEffect(() => {
    if (productAmountsManuallyEdited.declared) {
      return; // Don't auto-calculate if manually edited
    }
    const calculated = calculateAmount(
      productForm.declaredPricePerUnit,
      productForm.unit
    );
    setProductForm((prev) => ({
      ...prev,
      declaredAmount: calculated,
    }));
  }, [
    productForm.declaredPricePerUnit,
    productForm.unit,
    productAmountsManuallyEdited.declared,
  ]);

  useEffect(() => {
    if (productAmountsManuallyEdited.actual) {
      return; // Don't auto-calculate if manually edited
    }
    const calculated = calculateAmount(
      productForm.actualPricePerUnit,
      productForm.unit
    );
    setProductForm((prev) => ({
      ...prev,
      actualAmount: calculated,
    }));
  }, [
    productForm.actualPricePerUnit,
    productForm.unit,
    productAmountsManuallyEdited.actual,
  ]);

  // RTK Query hooks - vendorId is passed as prop, no need to fetch vendors
  const { data: hardwareData, isLoading: hardwareLoading } =
    useFetchHardwareQuery(
      {
        Vendor_ID: vendorId,
        search: hardwareSearch,
        limit: 100,
      },
      { skip: !vendorId }
    );

  const { data: productsData, isLoading: productsLoading } =
    useFetchProductsQuery(
      {
        Vendor_ID: vendorId,
        search: productSearch,
        limit: 100,
      },
      { skip: !vendorId }
    );

  const [createOrderItem] = useCreateOrderItemMutation();
  const [updateOrderItem] = useUpdateOrderItemMutation();

  const hardwareList = useMemo(() => hardwareData?.data || [], [hardwareData]);
  const productsList = useMemo(() => productsData?.data || [], [productsData]);

  // Filter hardware and products based on search (client-side filtering for UI)
  const filteredHardware = useMemo(() => {
    if (!hardwareSearch) return hardwareList;
    const searchLower = hardwareSearch.toLowerCase();
    return hardwareList.filter(
      (h: Hardware) =>
        h.Hardware_Name?.toLowerCase().includes(searchLower) ||
        h.Hardware_Description?.toLowerCase().includes(searchLower) ||
        h.Hardware_Code_Description?.toLowerCase().includes(searchLower)
    );
  }, [hardwareList, hardwareSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch) return productsList;
    const searchLower = productSearch.toLowerCase();
    return productsList.filter(
      (p: Product) =>
        p.Product_Description?.toLowerCase().includes(searchLower) ||
        p.Material?.toLowerCase().includes(searchLower)
    );
  }, [productsList, productSearch]);

  // Fetch all hardware/products when updating to find the matching item
  const { data: allHardwareData } = useFetchHardwareQuery(
    { limit: 1000 },
    { skip: !orderItem || orderItem.item_type !== "Hardware" }
  );

  const { data: allProductsData } = useFetchProductsQuery(
    { limit: 1000 },
    { skip: !orderItem || orderItem.item_type !== "Product" }
  );

  // Initialize form with orderItem data if updating
  useEffect(() => {
    if (orderItem) {
      const formData: FormState = {
        vendorId: "",
        selectedItem: null,
        description: orderItem.description || "",
        unit: orderItem.unit || "",
        kg:
          orderItem.kg !== null &&
          orderItem.kg !== undefined &&
          orderItem.kg !== 0
            ? String(orderItem.kg)
            : "",
        declaredPricePerUnit:
          orderItem.declared_price_per_unit !== null &&
          orderItem.declared_price_per_unit !== undefined &&
          orderItem.declared_price_per_unit !== 0
            ? String(orderItem.declared_price_per_unit)
            : "",
        declaredPricePerKg:
          orderItem.declared_price_per_kg !== null &&
          orderItem.declared_price_per_kg !== undefined &&
          orderItem.declared_price_per_kg !== 0
            ? String(orderItem.declared_price_per_kg)
            : "",
        actualPricePerUnit:
          orderItem.actual_price_per_unit !== null &&
          orderItem.actual_price_per_unit !== undefined &&
          orderItem.actual_price_per_unit !== 0
            ? String(orderItem.actual_price_per_unit)
            : "",
        actualPricePerKg:
          orderItem.actual_price_per_kg !== null &&
          orderItem.actual_price_per_kg !== undefined &&
          orderItem.actual_price_per_kg !== 0
            ? String(orderItem.actual_price_per_kg)
            : "",
        declaredAmount:
          orderItem.declared_amount !== null &&
          orderItem.declared_amount !== undefined &&
          orderItem.declared_amount !== 0
            ? String(orderItem.declared_amount)
            : "",
        actualAmount:
          orderItem.actual_amount !== null &&
          orderItem.actual_amount !== undefined &&
          orderItem.actual_amount !== 0
            ? String(orderItem.actual_amount)
            : "",
        movement: orderItem.movement === "Y",
      };

      // When updating, mark amounts as manually edited to preserve existing values
      setHardwareAmountsManuallyEdited({ declared: true, actual: true });
      setProductAmountsManuallyEdited({ declared: true, actual: true });

      if (orderItem.item_type === "Hardware") {
        setActiveTab("hardware");
        // Find hardware item by product_code
        if (allHardwareData?.data) {
          const matchingHardware = allHardwareData.data.find(
            (h: Hardware) => h.Hardware_Code === orderItem.product_code
          );
          if (matchingHardware) {
            formData.vendorId = vendorId;
            formData.selectedItem = matchingHardware;
            setHardwareForm(formData);
          } else {
            setHardwareForm(formData);
          }
        } else {
          setHardwareForm(formData);
        }
      } else {
        setActiveTab("product");
        // Find product item by product_code
        if (allProductsData?.data) {
          const matchingProduct = allProductsData.data.find(
            (p: Product) => p.Product_Code === orderItem.product_code
          );
          if (matchingProduct) {
            formData.vendorId = vendorId;
            formData.selectedItem = matchingProduct;
            setProductForm(formData);
          } else {
            setProductForm(formData);
          }
        } else {
          setProductForm(formData);
        }
      }
    }
  }, [orderItem, allHardwareData, allProductsData, vendorId]);

  const resetHardwareForm = () => {
    setHardwareForm({ ...initialFormState, vendorId });
    setHardwareSearch("");
    setHardwareAmountsManuallyEdited({ declared: false, actual: false });
  };

  const resetProductForm = () => {
    setProductForm({ ...initialFormState, vendorId });
    setProductSearch("");
    setProductAmountsManuallyEdited({ declared: false, actual: false });
  };

  const handleHardwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hardwareForm.selectedItem) {
      toast.error("Please select a hardware item");
      return;
    }

    if (!hardwareForm.description) {
      toast.error("Please enter a description");
      return;
    }

    const selectedHardware = hardwareForm.selectedItem as Hardware;

    setIsSubmitting(true);
    try {
      if (isUpdate && orderItem) {
        await updateOrderItem({
          order_item_id: orderItem.order_item_id,
          movement: hardwareForm.movement ? "Y" : "N",
          product_code: selectedHardware.Hardware_Code,
          item_type: "Hardware",
          description: hardwareForm.description,
          unit: hardwareForm.unit || undefined,
          kg: hardwareForm.kg ? parseFloat(hardwareForm.kg) : 0,
          declared_price_per_unit: hardwareForm.declaredPricePerUnit
            ? parseFloat(hardwareForm.declaredPricePerUnit)
            : 0,
          declared_price_per_kg: hardwareForm.declaredPricePerKg
            ? parseFloat(hardwareForm.declaredPricePerKg)
            : 0,
          actual_price_per_unit: hardwareForm.actualPricePerUnit
            ? parseFloat(hardwareForm.actualPricePerUnit)
            : 0,
          actual_price_per_kg: hardwareForm.actualPricePerKg
            ? parseFloat(hardwareForm.actualPricePerKg)
            : 0,
          declared_amount: hardwareForm.declaredAmount
            ? parseFloat(hardwareForm.declaredAmount)
            : 0,
          actual_amount: hardwareForm.actualAmount
            ? parseFloat(hardwareForm.actualAmount)
            : 0,
        }).unwrap();
        toast.success("Hardware item updated successfully");
      } else {
        await createOrderItem({
          order_id: orderId,
          movement: hardwareForm.movement ? "Y" : "N",
          product_code: selectedHardware.Hardware_Code,
          item_type: "Hardware",
          description: hardwareForm.description,
          unit: hardwareForm.unit || "",
          kg: hardwareForm.kg ? parseFloat(hardwareForm.kg) : 0,
          declared_price_per_unit: hardwareForm.declaredPricePerUnit
            ? parseFloat(hardwareForm.declaredPricePerUnit)
            : 0,
          declared_price_per_kg: hardwareForm.declaredPricePerKg
            ? parseFloat(hardwareForm.declaredPricePerKg)
            : 0,
          actual_price_per_unit: hardwareForm.actualPricePerUnit
            ? parseFloat(hardwareForm.actualPricePerUnit)
            : 0,
          actual_price_per_kg: hardwareForm.actualPricePerKg
            ? parseFloat(hardwareForm.actualPricePerKg)
            : 0,
          declared_amount: hardwareForm.declaredAmount
            ? parseFloat(hardwareForm.declaredAmount)
            : 0,
          actual_amount: hardwareForm.actualAmount
            ? parseFloat(hardwareForm.actualAmount)
            : 0,
        }).unwrap();
        toast.success("Hardware item added successfully");
      }
      resetHardwareForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error saving order item:", error);
      toast.error(
        error?.data?.message ||
          `Failed to ${
            isUpdate ? "update" : "add"
          } hardware item. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.selectedItem) {
      toast.error("Please select a product");
      return;
    }

    if (!productForm.description) {
      toast.error("Please enter a description");
      return;
    }

    const selectedProduct = productForm.selectedItem as Product;

    setIsSubmitting(true);
    try {
      if (isUpdate && orderItem) {
        await updateOrderItem({
          order_item_id: orderItem.order_item_id,
          movement: productForm.movement ? "Y" : "N",
          product_code: selectedProduct.Product_Code,
          item_type: "Product",
          description: productForm.description,
          unit: productForm.unit || undefined,
          kg: productForm.kg ? parseFloat(productForm.kg) : 0,
          declared_price_per_unit: productForm.declaredPricePerUnit
            ? parseFloat(productForm.declaredPricePerUnit)
            : 0,
          declared_price_per_kg: productForm.declaredPricePerKg
            ? parseFloat(productForm.declaredPricePerKg)
            : 0,
          actual_price_per_unit: productForm.actualPricePerUnit
            ? parseFloat(productForm.actualPricePerUnit)
            : 0,
          actual_price_per_kg: productForm.actualPricePerKg
            ? parseFloat(productForm.actualPricePerKg)
            : 0,
          declared_amount: productForm.declaredAmount
            ? parseFloat(productForm.declaredAmount)
            : 0,
          actual_amount: productForm.actualAmount
            ? parseFloat(productForm.actualAmount)
            : 0,
        }).unwrap();
        toast.success("Product item updated successfully");
      } else {
        await createOrderItem({
          order_id: orderId,
          movement: productForm.movement ? "Y" : "N",
          product_code: selectedProduct.Product_Code,
          item_type: "Product",
          description: productForm.description,
          unit: productForm.unit || undefined,
          kg: productForm.kg ? parseFloat(productForm.kg) : 0,
          declared_price_per_unit: productForm.declaredPricePerUnit
            ? parseFloat(productForm.declaredPricePerUnit)
            : 0,
          declared_price_per_kg: productForm.declaredPricePerKg
            ? parseFloat(productForm.declaredPricePerKg)
            : 0,
          actual_price_per_unit: productForm.actualPricePerUnit
            ? parseFloat(productForm.actualPricePerUnit)
            : 0,
          actual_price_per_kg: productForm.actualPricePerKg
            ? parseFloat(productForm.actualPricePerKg)
            : 0,
          declared_amount: productForm.declaredAmount
            ? parseFloat(productForm.declaredAmount)
            : 0,
          actual_amount: productForm.actualAmount
            ? parseFloat(productForm.actualAmount)
            : 0,
        }).unwrap();
        toast.success("Product item added successfully");
      }
      resetProductForm();
      onSuccess();
    } catch (error: any) {
      console.error("Error saving order item:", error);
      toast.error(
        error?.data?.message ||
          `Failed to ${
            isUpdate ? "update" : "add"
          } product item. Please try again.`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHardwareForm = () => (
    <form onSubmit={handleHardwareSubmit} className="space-y-4 py-4">
      {/* Hardware Selection - Searchable - Shows Hardware_Code_Description */}
      <div className="space-y-2">
        <Label htmlFor="hardware-item">Hardware Code Description *</Label>
        <DropdownMenu
          open={isHardwareDropdownOpen}
          onOpenChange={setIsHardwareDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <Input
                id="hardware-item"
                placeholder="Search hardware code description..."
                value={
                  hardwareForm.selectedItem
                    ? (hardwareForm.selectedItem as Hardware)
                        .Hardware_Code_Description
                    : hardwareSearch
                }
                onChange={(e) => {
                  setHardwareSearch(e.target.value);
                  setIsHardwareDropdownOpen(true);
                  if (hardwareForm.selectedItem) {
                    setHardwareForm((prev) => ({
                      ...prev,
                      selectedItem: null,
                    }));
                  }
                }}
                onFocus={() => setIsHardwareDropdownOpen(true)}
                className="w-full pr-10"
                disabled={!vendorId || hardwareLoading}
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto"
            align="start"
          >
            {hardwareLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredHardware.length > 0 ? (
              filteredHardware.map((hardware: Hardware) => (
                <DropdownMenuItem
                  key={hardware.Hardware_Code}
                  onClick={() => {
                    setHardwareForm((prev) => ({
                      ...prev,
                      selectedItem: hardware,
                    }));
                    setHardwareSearch("");
                    setIsHardwareDropdownOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {hardware.Hardware_Code_Description}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {hardware.Hardware_Name}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No hardware found
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="hardware-description">Description *</Label>
        <Input
          id="hardware-description"
          type="text"
          placeholder="Enter description"
          value={hardwareForm.description}
          onChange={(e) =>
            setHardwareForm((prev) => ({
              ...prev,
              description: e.target.value,
            }))
          }
        />
      </div>

      {/* Unit (No of Items) */}
      <div className="space-y-2">
        <Label htmlFor="hardware-unit">No of Items</Label>
        <Input
          id="hardware-unit"
          type="number"
          step="1"
          min="0"
          placeholder="Enter number of items"
          value={hardwareForm.unit}
          onChange={(e) => {
            const value = e.target.value;
            // Only allow integers (no decimals)
            if (value === "" || /^\d+$/.test(value)) {
              setHardwareForm((prev) => ({ ...prev, unit: value }));
            }
          }}
          onKeyDown={(e) => {
            // Prevent decimal point and negative sign
            if (
              e.key === "." ||
              e.key === "-" ||
              e.key === "+" ||
              e.key === "e" ||
              e.key === "E"
            ) {
              e.preventDefault();
            }
          }}
        />
      </div>

      {/* KG */}
      <div className="space-y-2">
        <Label htmlFor="hardware-kg">KG</Label>
        <Input
          id="hardware-kg"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={hardwareForm.kg}
          onChange={(e) =>
            setHardwareForm((prev) => ({ ...prev, kg: e.target.value }))
          }
        />
      </div>

      {/* Prices and Amounts - Two Columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="hardware-declared-price-unit">
            Declared Price/Unit
          </Label>
          <Input
            id="hardware-declared-price-unit"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.declaredPricePerUnit}
            onChange={(e) =>
              setHardwareForm((prev) => ({
                ...prev,
                declaredPricePerUnit: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardware-declared-price-kg">Declared Price/KG</Label>
          <Input
            id="hardware-declared-price-kg"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.declaredPricePerKg}
            onChange={(e) =>
              setHardwareForm((prev) => ({
                ...prev,
                declaredPricePerKg: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardware-actual-price-unit">Actual Price/Unit</Label>
          <Input
            id="hardware-actual-price-unit"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.actualPricePerUnit}
            onChange={(e) =>
              setHardwareForm((prev) => ({
                ...prev,
                actualPricePerUnit: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardware-actual-price-kg">Actual Price/KG</Label>
          <Input
            id="hardware-actual-price-kg"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.actualPricePerKg}
            onChange={(e) =>
              setHardwareForm((prev) => ({
                ...prev,
                actualPricePerKg: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardware-declared-amount">Declared Amount</Label>
          <Input
            id="hardware-declared-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.declaredAmount}
            onChange={(e) => {
              setHardwareForm((prev) => ({
                ...prev,
                declaredAmount: e.target.value,
              }));
              setHardwareAmountsManuallyEdited((prev) => ({
                ...prev,
                declared: true,
              }));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="hardware-actual-amount">Actual Amount</Label>
          <Input
            id="hardware-actual-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.actualAmount}
            onChange={(e) => {
              setHardwareForm((prev) => ({
                ...prev,
                actualAmount: e.target.value,
              }));
              setHardwareAmountsManuallyEdited((prev) => ({
                ...prev,
                actual: true,
              }));
            }}
          />
        </div>
      </div>

      {/* Movement Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="hardware-movement"
          checked={hardwareForm.movement}
          onCheckedChange={(checked) =>
            setHardwareForm((prev) => ({
              ...prev,
              movement: checked === true,
            }))
          }
        />
        <Label
          htmlFor="hardware-movement"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Received
        </Label>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUpdate ? "Updating..." : "Adding..."}
          </>
        ) : isUpdate ? (
          "Update Hardware Item"
        ) : (
          "Add Hardware Item"
        )}
      </Button>
    </form>
  );

  const renderProductForm = () => (
    <form onSubmit={handleProductSubmit} className="space-y-4 py-4">
      {/* Product Selection - Searchable */}
      <div className="space-y-2">
        <Label htmlFor="product-item">Product Name *</Label>
        <DropdownMenu
          open={isProductDropdownOpen}
          onOpenChange={setIsProductDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <Input
                id="product-item"
                placeholder="Search product..."
                value={
                  productForm.selectedItem
                    ? (productForm.selectedItem as Product).Product_Description
                    : productSearch
                }
                onChange={(e) => {
                  setProductSearch(e.target.value);
                  setIsProductDropdownOpen(true);
                  if (productForm.selectedItem) {
                    setProductForm((prev) => ({ ...prev, selectedItem: null }));
                  }
                }}
                onFocus={() => setIsProductDropdownOpen(true)}
                className="w-full pr-10"
                disabled={!vendorId || productsLoading}
              />
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto"
            align="start"
          >
            {productsLoading ? (
              <div className="flex items-center justify-center p-4">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map((product: Product) => (
                <DropdownMenuItem
                  key={product.Product_Code}
                  onClick={() => {
                    setProductForm((prev) => ({
                      ...prev,
                      selectedItem: product,
                    }));
                    setProductSearch("");
                    setIsProductDropdownOpen(false);
                  }}
                  className="cursor-pointer"
                >
                  {product.Product_Description}
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No products found
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="product-description">Description *</Label>
        <Input
          id="product-description"
          type="text"
          placeholder="Enter description"
          value={productForm.description}
          onChange={(e) =>
            setProductForm((prev) => ({ ...prev, description: e.target.value }))
          }
        />
      </div>

      {/* Unit (SQM) */}
      <div className="space-y-2">
        <Label htmlFor="product-unit">SQM</Label>
        <Input
          id="product-unit"
          type="text"
          placeholder="Enter SQM"
          value={productForm.unit}
          onChange={(e) =>
            setProductForm((prev) => ({ ...prev, unit: e.target.value }))
          }
        />
      </div>

      {/* KG */}
      <div className="space-y-2">
        <Label htmlFor="product-kg">KG</Label>
        <Input
          id="product-kg"
          type="number"
          step="0.01"
          placeholder="0.00"
          value={productForm.kg}
          onChange={(e) =>
            setProductForm((prev) => ({ ...prev, kg: e.target.value }))
          }
        />
      </div>

      {/* Prices and Amounts - Two Columns */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="product-declared-price-unit">
            Declared Price/Unit
          </Label>
          <Input
            id="product-declared-price-unit"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.declaredPricePerUnit}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                declaredPricePerUnit: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-declared-price-kg">Declared Price/KG</Label>
          <Input
            id="product-declared-price-kg"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.declaredPricePerKg}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                declaredPricePerKg: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-actual-price-unit">Actual Price/Unit</Label>
          <Input
            id="product-actual-price-unit"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.actualPricePerUnit}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                actualPricePerUnit: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-actual-price-kg">Actual Price/KG</Label>
          <Input
            id="product-actual-price-kg"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.actualPricePerKg}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                actualPricePerKg: e.target.value,
              }))
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-declared-amount">Declared Amount</Label>
          <Input
            id="product-declared-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.declaredAmount}
            onChange={(e) => {
              setProductForm((prev) => ({
                ...prev,
                declaredAmount: e.target.value,
              }));
              setProductAmountsManuallyEdited((prev) => ({
                ...prev,
                declared: true,
              }));
            }}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-actual-amount">Actual Amount</Label>
          <Input
            id="product-actual-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.actualAmount}
            onChange={(e) => {
              setProductForm((prev) => ({
                ...prev,
                actualAmount: e.target.value,
              }));
              setProductAmountsManuallyEdited((prev) => ({
                ...prev,
                actual: true,
              }));
            }}
          />
        </div>
      </div>

      {/* Movement Checkbox */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="product-movement"
          checked={productForm.movement}
          onCheckedChange={(checked) =>
            setProductForm((prev) => ({
              ...prev,
              movement: checked === true,
            }))
          }
        />
        <Label
          htmlFor="product-movement"
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
        >
          Received
        </Label>
      </div>

      {/* Submit Button */}
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {isUpdate ? "Updating..." : "Adding..."}
          </>
        ) : isUpdate ? (
          "Update Product Item"
        ) : (
          "Add Product Item"
        )}
      </Button>
    </form>
  );

  const isLoadingUpdateData =
    orderItem &&
    ((orderItem.item_type === "Hardware" && !allHardwareData) ||
      (orderItem.item_type === "Product" && !allProductsData));

  if (isLoadingUpdateData) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2">
              <CompactLoader />
              <span>Loading form data...</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-7xl max-h-[95vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 py-4 border-b flex-shrink-0">
          <DialogTitle>
            {isUpdate ? "Update Order Item" : "Add Order Item"}
          </DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6 overflow-y-auto flex-1">
          <Tabs
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as "hardware" | "product")}
            className="h-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="hardware">Hardware Items</TabsTrigger>
              <TabsTrigger value="product">Product Code</TabsTrigger>
            </TabsList>
            <TabsContent value="hardware" className="mt-0">
              {renderHardwareForm()}
            </TabsContent>
            <TabsContent value="product" className="mt-0">
              {renderProductForm()}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
