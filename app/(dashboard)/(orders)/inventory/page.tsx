"use client";

import React, { useState } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { InventoryTable } from "./components/inventory-table";
import { InventoryInfoDialog } from "./components/inventory-info-dialog";
import { InventorySplitDialog } from "./components/inventory-split-dialog";
import { OrderInventory } from "@/store/endpoints/orderInventory/type";

const InventoryPage = () => {
  const [mode, setMode] = useState<"all" | "available">("all");
  const [infoDialogOpen, setInfoDialogOpen] = useState(false);
  const [splitDialogOpen, setSplitDialogOpen] = useState(false);
  const [selectedInventory, setSelectedInventory] =
    useState<OrderInventory | null>(null);

  const handleInfoClick = (inventory: OrderInventory) => {
    setSelectedInventory(inventory);
    setInfoDialogOpen(true);
  };

  const handleSplitClick = (inventory: OrderInventory) => {
    setSelectedInventory(inventory);
    setSplitDialogOpen(true);
  };

  const handleInfoClose = () => {
    setInfoDialogOpen(false);
    setSelectedInventory(null);
  };

  const handleSplitClose = () => {
    setSplitDialogOpen(false);
    setSelectedInventory(null);
  };

  const handleSplitSuccess = () => {
    // Refetch will happen automatically via RTK Query cache invalidation
    // If needed, we can add manual refetch here
  };

  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">Inventory</h1>
          <p className="text-muted-foreground">
            View and manage your order inventory
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Mode Toggle */}
        <div className="flex items-center gap-4">
          <Tabs value={mode} onValueChange={(v) => setMode(v as "all" | "available")}>
            <TabsList className="grid w-full sm:w-auto grid-cols-2">
              <TabsTrigger value="all">All Inventory</TabsTrigger>
              <TabsTrigger value="available">Available Inventory</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Inventory Table */}
        <InventoryTable
          mode={mode}
          onInfoClick={handleInfoClick}
          onSplitClick={handleSplitClick}
        />
      </div>

      {/* Info Dialog */}
      <InventoryInfoDialog
        inventory={selectedInventory}
        isOpen={infoDialogOpen}
        onClose={handleInfoClose}
      />

      {/* Split Dialog */}
      <InventorySplitDialog
        inventory={selectedInventory}
        isOpen={splitDialogOpen}
        onClose={handleSplitClose}
        onSuccess={handleSplitSuccess}
      />
    </main>
  );
};

export default InventoryPage;
