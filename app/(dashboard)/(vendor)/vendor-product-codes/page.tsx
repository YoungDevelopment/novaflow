import { VendorProductsTable } from "./components/vendor-products-table";

export default function Home() {
  return (
    <main className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Vendor Products</h1>
        <VendorProductsTable />
      </div>
    </main>
  );
}
