import { CustomerProductsTable } from "./components/customer-products-table";

export default function Home() {
  return (
    <main className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-foreground">
            Customer Product Codes
          </h1>
          <p className="text-muted-foreground">
            Manage your customer product codes and their information
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <CustomerProductsTable />
      </div>
    </main>
  );
}
