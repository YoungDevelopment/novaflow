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
import { Vendor, Material, Adhesive, ProductFormProps } from "../interface";
import { CompactLoader } from "@/app/(dashboard)/components";
import {
  useCreateProductMutation,
  useUpdateProductMutation,
  useFetchVendorNamesQuery,
} from "@/store/endpoints/vendorProducts";

export function ProductForm({ product, onClose, onSuccess }: ProductFormProps) {
  const [materials, setMaterials] = React.useState<Material[]>([]);
  const [adhesives, setAdhesives] = React.useState<Adhesive[]>([]);
  const [submitSuccess, setSubmitSuccess] = React.useState(false);

  // RTK Query hooks
  const { data: vendorsData, isLoading: vendorsLoading } =
    useFetchVendorNamesQuery();
  const [createProduct] = useCreateProductMutation();
  const [updateProduct] = useUpdateProductMutation();

  // Reset success state when form unmounts or product changes
  React.useEffect(() => {
    setSubmitSuccess(false);
  }, [product]);

  const [selectedVendor, setSelectedVendor] = React.useState<Vendor | null>(
    null
  );
  const [selectedMaterial, setSelectedMaterial] =
    React.useState<Material | null>(null);
  const [selectedAdhesive, setSelectedAdhesive] =
    React.useState<Adhesive | null>(null);
  const [width, setWidth] = React.useState<string>("");
  const [paperGSM, setPaperGSM] = React.useState<string>("");

  const [isLoading, setIsLoading] = React.useState(false);
  const [isLoadingData, setIsLoadingData] = React.useState(true);

  const isUpdate = !!product;

  // Extract vendors from RTK Query
  const vendors = React.useMemo(() => vendorsData?.data || [], [vendorsData]);

  // Fetch materials and adhesives on mount
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const [materialsRes, adhesivesRes] = await Promise.all([
          fetch("/api/collection/fetch-all-material"),
          fetch("/api/collection/fetch-all-adhesive"),
        ]);

        if (!materialsRes.ok || !adhesivesRes.ok) {
          throw new Error("Failed to fetch form data");
        }

        const materialsData = await materialsRes.json();
        const adhesivesData = await adhesivesRes.json();

        setMaterials(materialsData.data || []);
        setAdhesives(adhesivesData.data || []);
      } catch (error) {
        console.error("Error fetching form data:", error);
        toast.error("Failed to load form data");
      } finally {
        setIsLoadingData(false);
      }
    };

    fetchData();
  }, []);

  React.useEffect(() => {
    if (
      product &&
      vendors.length > 0 &&
      materials.length > 0 &&
      adhesives.length > 0
    ) {
      const vendor = vendors.find(
        (v: Vendor) => v.Vendor_ID === product.Vendor_ID
      );
      const material = materials.find(
        (m: Material) => m.Material_Name === product.Material
      );
      const adhesive = adhesives.find(
        (a: Adhesive) => a.Adhesive_Name === product.Adhesive_Type
      );

      setSelectedVendor(vendor || null);
      setSelectedMaterial(material || null);
      setSelectedAdhesive(adhesive || null);
      setWidth(product.Width.toString());
      setPaperGSM(product.Paper_GSM.toString());
    }
  }, [product, vendors, materials, adhesives]);

  const generateProductDescription = () => {
    if (
      !selectedVendor ||
      !selectedMaterial ||
      !selectedAdhesive ||
      !width ||
      !paperGSM
    ) {
      return "";
    }
    return `${selectedMaterial.Material_Mask_ID}-${width}-${selectedAdhesive.Adhesive_Mask_ID}-${paperGSM}-${selectedVendor.Vendor_Mask_ID}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (
      !selectedVendor ||
      !selectedMaterial ||
      !selectedAdhesive ||
      !width ||
      !paperGSM
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    const productDescription = generateProductDescription();

    setIsLoading(true);
    setSubmitSuccess(false);

    try {
      if (isUpdate) {
        const updatePayload = {
          Product_Code: product.Product_Code,
          Vendor_ID: selectedVendor.Vendor_ID,
          Material: selectedMaterial.Material_Name,
          Width: Number.parseInt(width),
          Adhesive_Type: selectedAdhesive.Adhesive_Name,
          Paper_GSM: Number.parseInt(paperGSM),
          Product_Description: productDescription,
        };
        const result = await updateProduct(updatePayload).unwrap();
        toast.success(
          `Product "${result.Product_Description}" has been updated successfully`
        );
        setSubmitSuccess(true);

        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1200);
      } else {
        const createPayload = {
          Vendor_ID: selectedVendor.Vendor_ID,
          Material: selectedMaterial.Material_Name,
          Width: Number.parseInt(width),
          Adhesive_Type: selectedAdhesive.Adhesive_Name,
          Paper_GSM: Number.parseInt(paperGSM),
          Product_Description: productDescription,
        };
        const result = await createProduct(createPayload).unwrap();
        toast.success(
          `Product "${result.Product_Description}" has been created successfully`
        );
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
        `Failed to ${isUpdate ? "update" : "create"} product`;
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
            {isUpdate ? "Update Product" : "Create New Product"}
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

          {/* Material Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Material *</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {selectedMaterial?.Material_Name || "Select Material"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {materials.map((material) => (
                  <DropdownMenuItem
                    key={material.Material_Mask_ID}
                    onClick={() => setSelectedMaterial(material)}
                    className={
                      selectedMaterial?.Material_Mask_ID ===
                      material.Material_Mask_ID
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {material.Material_Name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Width Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Width *</label>
            <Input
              type="number"
              placeholder="Enter width"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              min="0"
            />
          </div>

          {/* Adhesive Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Adhesive Type *</label>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-transparent"
                >
                  {selectedAdhesive?.Adhesive_Name || "Select Adhesive"}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-full">
                {adhesives.map((adhesive) => (
                  <DropdownMenuItem
                    key={adhesive.Adhesive_Mask_ID}
                    onClick={() => setSelectedAdhesive(adhesive)}
                    className={
                      selectedAdhesive?.Adhesive_Mask_ID ===
                      adhesive.Adhesive_Mask_ID
                        ? "bg-accent"
                        : ""
                    }
                  >
                    {adhesive.Adhesive_Name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Paper GSM Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paper GSM *</label>
            <Input
              type="number"
              placeholder="Enter paper GSM"
              value={paperGSM}
              onChange={(e) => setPaperGSM(e.target.value)}
              min="0"
            />
          </div>

          {/* Product Description (Read-only) */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Product Description</label>
            <Input
              type="text"
              value={generateProductDescription()}
              readOnly
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated: Material-Width-Adhesive-GSM-Vendor
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
              ? "Update Product"
              : "Create Product"}
          </Button>
        </div>
      </div>
    </div>
  );
}
