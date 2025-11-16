"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Loader2, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { useCreateOrderItemMutation } from "@/store";
import { useFetchHardwareQuery } from "@/store/endpoints/vendorHardware";
import {
  useFetchProductsQuery,
  useFetchVendorNamesQuery,
} from "@/store/endpoints/vendorProducts";
import type { Hardware } from "@/store/endpoints/vendorHardware/type";
import type { Product } from "@/store/endpoints/vendorProducts/type";
import type { Vendor } from "@/store/endpoints/vendor/type";

interface OrderItemsFormProps {
  orderId: string;
  orderType?: string;
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
  kg: "0",
  declaredPricePerUnit: "0",
  declaredPricePerKg: "0",
  actualPricePerUnit: "0",
  actualPricePerKg: "0",
  declaredAmount: "0",
  actualAmount: "0",
  movement: false,
};

export default function OrderItemsForm({
  orderId,
  orderType = "Purchase",
}: OrderItemsFormProps) {
  const [activeTab, setActiveTab] = useState<"hardware" | "product">(
    "hardware"
  );
  const [hardwareForm, setHardwareForm] = useState<FormState>(initialFormState);
  const [productForm, setProductForm] = useState<FormState>(initialFormState);
  const [hardwareSearch, setHardwareSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [isHardwareDropdownOpen, setIsHardwareDropdownOpen] = useState(false);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // RTK Query hooks
  const { data: vendorsData, isLoading: vendorsLoading } =
    useFetchVendorNamesQuery();

  const { data: hardwareData, isLoading: hardwareLoading } =
    useFetchHardwareQuery(
      {
        Vendor_ID: hardwareForm.vendorId,
        search: hardwareSearch,
        limit: 100,
      },
      { skip: !hardwareForm.vendorId }
    );

  const { data: productsData, isLoading: productsLoading } =
    useFetchProductsQuery(
      {
        Vendor_ID: productForm.vendorId,
        search: productSearch,
        limit: 100,
      },
      { skip: !productForm.vendorId }
    );

  const [createOrderItem] = useCreateOrderItemMutation();

  const vendors = useMemo(() => vendorsData?.data || [], [vendorsData]);
  const hardwareList = useMemo(() => hardwareData?.data || [], [hardwareData]);
  const productsList = useMemo(() => productsData?.data || [], [productsData]);

  // Filter hardware and products based on search
  const filteredHardware = useMemo(() => {
    if (!hardwareSearch) return hardwareList;
    const searchLower = hardwareSearch.toLowerCase();
    return hardwareList.filter(
      (h: Hardware) =>
        h.Hardware_Name?.toLowerCase().includes(searchLower) ||
        h.Hardware_Description?.toLowerCase().includes(searchLower)
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

  // Helpers: compute amounts from inputs
  const toNum = (val: string) => {
    const n = parseFloat(val);
    return Number.isFinite(n) ? n : 0;
  };

  const computeDeclaredAmount = (unitStr: string, kgStr: string, pricePerUnitStr: string, pricePerKgStr: string) => {
    const qty = toNum(unitStr);
    const kg = toNum(kgStr);
    const ppu = toNum(pricePerUnitStr);
    const ppk = toNum(pricePerKgStr);
    return (qty * ppu + kg * ppk).toFixed(2);
  };

  const computeActualAmount = (unitStr: string, kgStr: string, pricePerUnitStr: string, pricePerKgStr: string) => {
    const qty = toNum(unitStr);
    const kg = toNum(kgStr);
    const ppu = toNum(pricePerUnitStr);
    const ppk = toNum(pricePerKgStr);
    return (qty * ppu + kg * ppk).toFixed(2);
  };

  // Auto-calc amounts for Hardware form
  useEffect(() => {
    setHardwareForm((prev) => ({
      ...prev,
      declaredAmount: computeDeclaredAmount(
        prev.unit,
        prev.kg,
        prev.declaredPricePerUnit,
        prev.declaredPricePerKg
      ),
      actualAmount: computeActualAmount(
        prev.unit,
        prev.kg,
        prev.actualPricePerUnit,
        prev.actualPricePerKg
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hardwareForm.unit,
    hardwareForm.kg,
    hardwareForm.declaredPricePerUnit,
    hardwareForm.declaredPricePerKg,
    hardwareForm.actualPricePerUnit,
    hardwareForm.actualPricePerKg,
  ]);

  // Auto-calc amounts for Product form
  useEffect(() => {
    setProductForm((prev) => ({
      ...prev,
      declaredAmount: computeDeclaredAmount(
        prev.unit,
        prev.kg,
        prev.declaredPricePerUnit,
        prev.declaredPricePerKg
      ),
      actualAmount: computeActualAmount(
        prev.unit,
        prev.kg,
        prev.actualPricePerUnit,
        prev.actualPricePerKg
      ),
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    productForm.unit,
    productForm.kg,
    productForm.declaredPricePerUnit,
    productForm.declaredPricePerKg,
    productForm.actualPricePerUnit,
    productForm.actualPricePerKg,
  ]);

  const resetHardwareForm = () => {
    setHardwareForm(initialFormState);
    setHardwareSearch("");
  };

  const resetProductForm = () => {
    setProductForm(initialFormState);
    setProductSearch("");
  };

  const handleHardwareSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!hardwareForm.vendorId) {
      toast.error("Please select a vendor");
      return;
    }

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
      await createOrderItem({
        order_id: orderId,
        movement: hardwareForm.movement ? "Y" : "N",
        product_code: selectedHardware.Hardware_Code,
        item_type: "Hardware",
        description: hardwareForm.description,
        unit: hardwareForm.unit || undefined,
        kg: parseFloat(hardwareForm.kg) || 0,
        declared_price_per_unit:
          parseFloat(hardwareForm.declaredPricePerUnit) || 0,
        declared_price_per_kg: parseFloat(hardwareForm.declaredPricePerKg) || 0,
        actual_price_per_unit: parseFloat(hardwareForm.actualPricePerUnit) || 0,
        actual_price_per_kg: parseFloat(hardwareForm.actualPricePerKg) || 0,
        declared_amount: parseFloat(hardwareForm.declaredAmount) || 0,
        actual_amount: parseFloat(hardwareForm.actualAmount) || 0,
      }).unwrap();

      toast.success("Hardware item added successfully");
      resetHardwareForm();
    } catch (error: any) {
      console.error("Error creating order item:", error);
      toast.error(
        error?.data?.message || "Failed to add hardware item. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!productForm.vendorId) {
      toast.error("Please select a vendor");
      return;
    }

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
      await createOrderItem({
        order_id: orderId,
        movement: productForm.movement ? "Y" : "N",
        product_code: selectedProduct.Product_Code,
        item_type: "Product",
        description: productForm.description,
        unit: productForm.unit || undefined,
        kg: parseFloat(productForm.kg) || 0,
        declared_price_per_unit:
          parseFloat(productForm.declaredPricePerUnit) || 0,
        declared_price_per_kg: parseFloat(productForm.declaredPricePerKg) || 0,
        actual_price_per_unit: parseFloat(productForm.actualPricePerUnit) || 0,
        actual_price_per_kg: parseFloat(productForm.actualPricePerKg) || 0,
        declared_amount: parseFloat(productForm.declaredAmount) || 0,
        actual_amount: parseFloat(productForm.actualAmount) || 0,
      }).unwrap();

      toast.success("Product item added successfully");
      resetProductForm();
    } catch (error: any) {
      console.error("Error creating order item:", error);
      toast.error(
        error?.data?.message || "Failed to add product item. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderHardwareForm = () => (
    <form onSubmit={handleHardwareSubmit} className="space-y-4">
      {/* Vendor Selection */}
      <div className="space-y-2">
        <Label htmlFor="hardware-vendor">Vendor *</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-transparent"
              disabled={vendorsLoading}
            >
              {vendors.find((v) => v.Vendor_ID === hardwareForm.vendorId)
                ?.Vendor_Name || "Select Vendor"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full max-h-[300px] overflow-y-auto">
            {vendors.map((vendor) => (
              <DropdownMenuItem
                key={vendor.Vendor_ID}
                onClick={() => {
                  setHardwareForm((prev) => ({
                    ...prev,
                    vendorId: vendor.Vendor_ID,
                    selectedItem: null,
                  }));
                  setHardwareSearch("");
                }}
                className={
                  hardwareForm.vendorId === vendor.Vendor_ID ? "bg-accent" : ""
                }
              >
                {vendor.Vendor_Name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Hardware Selection - Searchable */}
      <div className="space-y-4">
        <Label htmlFor="hardware-item">Hardware Name *</Label>
        <DropdownMenu
          open={isHardwareDropdownOpen}
          onOpenChange={setIsHardwareDropdownOpen}
        >
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <Input
                id="hardware-item"
                placeholder="Search hardware..."
                value={
                  hardwareForm.selectedItem
                    ? (hardwareForm.selectedItem as Hardware).Hardware_Name
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
                disabled={!hardwareForm.vendorId || hardwareLoading}
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
                  {hardware.Hardware_Name}
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
          type="text"
          placeholder="Enter number of items"
          value={hardwareForm.unit}
          onChange={(e) =>
            setHardwareForm((prev) => ({ ...prev, unit: e.target.value }))
          }
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

      {/* Prices and Amounts - Two Columns (Declared left, Actual right) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Declared Column */}
        <div className="space-y-2">
          <Label htmlFor="hardware-declared-price-unit">
            Declared Amount per Unit
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
          <Label htmlFor="hardware-declared-price-kg">Declared Amount per KG</Label>
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
          <Label htmlFor="hardware-declared-amount">Total Declared Amount</Label>
          <Input
            id="hardware-declared-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.declaredAmount}
            onChange={(e) =>
              setHardwareForm((prev) => ({
                ...prev,
                declaredAmount: e.target.value,
              }))
            }
          />
        </div>
        {/* Actual Column */}
        <div className="space-y-2">
          <Label htmlFor="hardware-actual-price-unit">Actual Amount per Unit</Label>
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
          <Label htmlFor="hardware-actual-price-kg">Actual Amount per KG</Label>
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
          <Label htmlFor="hardware-actual-amount">Total Actual Amount</Label>
          <Input
            id="hardware-actual-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={hardwareForm.actualAmount}
            onChange={(e) =>
              setHardwareForm((prev) => ({
                ...prev,
                actualAmount: e.target.value,
              }))
            }
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
            Adding...
          </>
        ) : (
          "Add Hardware Item"
        )}
      </Button>
    </form>
  );

  const renderProductForm = () => (
    <form onSubmit={handleProductSubmit} className="space-y-4">
      {/* Vendor Selection */}
      <div className="space-y-2">
        <Label htmlFor="product-vendor">Vendor *</Label>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full justify-between bg-transparent"
              disabled={vendorsLoading}
            >
              {vendors.find((v) => v.Vendor_ID === productForm.vendorId)
                ?.Vendor_Name || "Select Vendor"}
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-full max-h-[300px] overflow-y-auto">
            {vendors.map((vendor) => (
              <DropdownMenuItem
                key={vendor.Vendor_ID}
                onClick={() => {
                  setProductForm((prev) => ({
                    ...prev,
                    vendorId: vendor.Vendor_ID,
                    selectedItem: null,
                  }));
                  setProductSearch("");
                }}
                className={
                  productForm.vendorId === vendor.Vendor_ID ? "bg-accent" : ""
                }
              >
                {vendor.Vendor_Name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
                disabled={!productForm.vendorId || productsLoading}
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

      {/* Prices and Amounts - Two Columns (Declared left, Actual right) */}
      <div className="grid grid-cols-2 gap-4">
        {/* Declared Column */}
        <div className="space-y-2">
          <Label htmlFor="product-declared-price-unit">
            Declared Amount per Unit
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
          <Label htmlFor="product-declared-price-kg">Declared Amount per KG</Label>
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
          <Label htmlFor="product-declared-amount">Total Declared Amount</Label>
          <Input
            id="product-declared-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.declaredAmount}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                declaredAmount: e.target.value,
              }))
            }
          />
        </div>
        {/* Actual Column */}
        <div className="space-y-2">
          <Label htmlFor="product-actual-price-unit">Actual Amount per Unit</Label>
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
          <Label htmlFor="product-actual-price-kg">Actual Amount per KG</Label>
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
          <Label htmlFor="product-actual-amount">Total Actual Amount</Label>
          <Input
            id="product-actual-amount"
            type="number"
            step="0.01"
            placeholder="0.00"
            value={productForm.actualAmount}
            onChange={(e) =>
              setProductForm((prev) => ({
                ...prev,
                actualAmount: e.target.value,
              }))
            }
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
            Adding...
          </>
        ) : (
          "Add Product Item"
        )}
      </Button>
    </form>
  );

  return (
    <div className="w-full pt-4 bg-white">
      <Card className="p-6">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "hardware" | "product")}
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="hardware">Hardware Items</TabsTrigger>
            <TabsTrigger value="product">Product Code</TabsTrigger>
          </TabsList>
          <TabsContent value="hardware" className="mt-6">
            {renderHardwareForm()}
          </TabsContent>
          <TabsContent value="product" className="mt-6">
            {renderProductForm()}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
