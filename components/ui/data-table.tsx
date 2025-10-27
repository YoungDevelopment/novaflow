"use client";

import * as React from "react";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
} from "@tanstack/react-table";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Types for table configuration
export interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  accessorKey?: keyof T | string;
  cell?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  filterable?: boolean;
  width?: string;
  align?: "left" | "center" | "right";
}

export interface TableAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick?: (row: T) => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: (row: T) => boolean;
  cell?: (value: any, row: T) => React.ReactNode;
  key?: string;
  className?: string; // For custom styling like text-red-600
}

export interface TableConfig<T> {
  columns: TableColumn<T>[];
  actions?: TableAction<T>[];
  searchable?: boolean;
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  backendSearch?: boolean; // If true, search is handled by backend, if false/undefined, frontend search
  onSearchChange?: (searchTerm: string) => void; // Callback for backend search
  pagination?: {
    enabled: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
  };
  sorting?: boolean;
  filtering?: boolean;
  loading?: boolean;
  emptyMessage?: string;
  noResultsMessage?: string;
}

export interface DataTableProps<T> {
  data: T[];
  config: TableConfig<T>;
  onRowClick?: (row: T) => void;
  className?: string;
  headerActions?: React.ReactNode;
  searchValue?: string; // For backend search - controlled search input value
  externalPagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
}

const DEFAULT_PAGE_SIZE_OPTIONS = [5, 10, 15, 20, 30, 40, 50];

export function DataTable<T extends Record<string, any>>({
  data,
  config,
  onRowClick,
  className,
  headerActions,
  searchValue,
  externalPagination,
}: DataTableProps<T>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: config.pagination?.pageSize || 10,
  });

  // Handle edge case where pagination is out of bounds after filtering/search
  React.useEffect(() => {
    if (data.length > 0 && config.pagination?.enabled && !externalPagination) {
      const totalPages = Math.ceil(data.length / pagination.pageSize);
      // If current page index is out of bounds, go to last page
      if (pagination.pageIndex >= totalPages && totalPages > 0) {
        setPagination((prev) => ({
          ...prev,
          pageIndex: totalPages - 1,
        }));
      }
    }
  }, [
    data.length,
    pagination.pageSize,
    pagination.pageIndex,
    config.pagination?.enabled,
    externalPagination,
  ]);

  // Convert our custom columns to TanStack Table columns
  const columns: ColumnDef<T>[] = React.useMemo(() => {
    const tableColumns: ColumnDef<T>[] = config.columns.map((col) => ({
      accessorKey: col.accessorKey || col.key,
      header: col.header,
      cell: ({ row }) => {
        const value = row.getValue(String(col.accessorKey || col.key));
        return col.cell ? col.cell(value, row.original) : value;
      },
      enableSorting: col.sortable !== false,
      enableColumnFilter: col.filterable !== false,
    }));

    // Add actions column if actions are provided
    if (config.actions && config.actions.length > 0) {
      tableColumns.push({
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
          // Handle custom cell renderer
          const customAction = config.actions!.find((action) => action.cell);
          if (customAction) {
            return (
              <div className="flex justify-center">
                {customAction.cell!(
                  row.getValue(String(customAction.key)),
                  row.original
                )}
              </div>
            );
          }

          // Default dropdown menu for regular actions
          return (
            <div className="flex justify-center">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {config.actions!.map((action, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        action.onClick?.(row.original);
                      }}
                      disabled={action.disabled?.(row.original)}
                      className={action.className}
                    >
                      {action.icon && (
                        <span className="mr-2">{action.icon}</span>
                      )}
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
        enableSorting: false,
        enableColumnFilter: false,
      });
    }

    return tableColumns;
  }, [config.columns, config.actions]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel:
      config.sorting !== false ? getSortedRowModel() : undefined,
    getFilteredRowModel:
      config.filtering !== false && !config.backendSearch
        ? getFilteredRowModel()
        : undefined,
    getPaginationRowModel:
      config.pagination?.enabled && !externalPagination
        ? getPaginationRowModel()
        : undefined,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: config.backendSearch ? undefined : setGlobalFilter,
    onPaginationChange: externalPagination ? undefined : setPagination,
    state: {
      sorting,
      columnFilters,
      globalFilter: config.backendSearch ? "" : globalFilter,
      pagination: externalPagination
        ? {
            pageIndex: externalPagination.currentPage - 1,
            pageSize: externalPagination.pageSize,
          }
        : pagination,
    },
    // Prevent auto-reset to page 1 when data changes (e.g., after cache invalidation)
    autoResetPageIndex: false,
    globalFilterFn: config.backendSearch
      ? undefined
      : config.searchFields
      ? (row, columnId, value) => {
          return config.searchFields!.some((field) => {
            const cellValue = row.getValue(field as string);
            return String(cellValue)
              .toLowerCase()
              .includes(value.toLowerCase());
          });
        }
      : undefined,
  });

  // Handle search
  const handleSearch = (value: string) => {
    if (config.backendSearch) {
      // For backend search, call the callback and don't use frontend filtering
      config.onSearchChange?.(value);
    } else {
      // For frontend search, use TanStack Table's global filter
      if (config.searchFields) {
        setGlobalFilter(value);
      } else {
        // Fallback to simple filtering if no search fields specified
        setGlobalFilter(value);
      }
    }
  };

  return (
    <div className={`w-full space-y-4 ${className || ""}`}>
      {/* Header with search and actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          {config.searchable !== false && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={config.searchPlaceholder || "Search..."}
                value={config.backendSearch ? searchValue || "" : globalFilter}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 w-full sm:w-[300px]"
              />
            </div>
          )}
          {headerActions}
        </div>

        {config.pagination?.enabled && (
          <div className="text-sm text-muted-foreground">
            {externalPagination
              ? `${externalPagination.totalItems} total entries`
              : `${table.getFilteredRowModel().rows.length} of ${
                  data.length
                } entries`}
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={`font-semibold ${
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }`}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    {header.column.getIsSorted() === "asc" && " ↑"}
                    {header.column.getIsSorted() === "desc" && " ↓"}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {config.loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading...</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  className={`hover:bg-muted/50 ${
                    onRowClick ? "cursor-pointer" : ""
                  }`}
                  onClick={() => onRowClick?.(row.original)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {globalFilter
                    ? config.noResultsMessage || "No results found."
                    : config.emptyMessage || "No data available."}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {config.pagination?.enabled && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {externalPagination
              ? `Page ${externalPagination.currentPage} of ${externalPagination.totalPages} (${externalPagination.totalItems} total entries)`
              : `Page ${
                  table.getState().pagination.pageIndex + 1
                } of ${table.getPageCount()} (${
                  table.getFilteredRowModel().rows.length
                } total entries)`}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            {/* Page size selector */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">
                Rows per page:
              </label>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-auto">
                    {externalPagination
                      ? externalPagination.pageSize
                      : table.getState().pagination.pageSize}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(
                    config.pagination.pageSizeOptions ||
                    DEFAULT_PAGE_SIZE_OPTIONS
                  ).map((pageSize) => (
                    <DropdownMenuItem
                      key={pageSize}
                      onClick={() =>
                        externalPagination
                          ? externalPagination.onPageSizeChange(pageSize)
                          : table.setPageSize(pageSize)
                      }
                      className={
                        (externalPagination
                          ? externalPagination.pageSize
                          : table.getState().pagination.pageSize) === pageSize
                          ? "bg-accent"
                          : ""
                      }
                    >
                      {pageSize}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Pagination controls */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  externalPagination
                    ? externalPagination.onPageChange(
                        externalPagination.currentPage - 1
                      )
                    : table.previousPage()
                }
                disabled={
                  externalPagination
                    ? externalPagination.currentPage <= 1
                    : !table.getCanPreviousPage()
                }
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  externalPagination
                    ? externalPagination.onPageChange(
                        externalPagination.currentPage + 1
                      )
                    : table.nextPage()
                }
                disabled={
                  externalPagination
                    ? externalPagination.currentPage >=
                      externalPagination.totalPages
                    : !table.getCanNextPage()
                }
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Utility function to create common column configurations
export function createColumn<T>(
  key: keyof T | string,
  header: string,
  options?: Partial<TableColumn<T>>
): TableColumn<T> {
  return {
    key,
    header,
    accessorKey: key,
    sortable: true,
    filterable: true,
    align: "left",
    ...options,
  };
}

// Utility function to create action configurations
export function createAction<T>(
  label: string,
  onClick: (row: T) => void,
  options?: Partial<TableAction<T>>
): TableAction<T> {
  return {
    label,
    onClick,
    variant: "outline",
    ...options,
  };
}
