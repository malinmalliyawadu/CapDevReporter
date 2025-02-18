"use client";

import React, { useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  SortingState,
  ColumnFiltersState,
  ExpandedState,
} from "@tanstack/react-table";
import { AlertTriangle, BarChart } from "lucide-react";
import { DateRange } from "react-day-picker";
import { subYears, startOfYear } from "date-fns";
import { trpc } from "@/trpc/client";
import { ErrorBoundary } from "react-error-boundary";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { TimeDistributionCharts } from "@/components/reports/TimeDistributionCharts";
import { TimeReportTable } from "@/components/reports/TimeReportTable";
import { UtilizationIssues } from "@/components/reports/UtilizationIssues";
import { createColumns } from "@/components/reports/TableColumns";
import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TableSkeleton, CardSkeleton } from "@/components/ui/skeleton";

function ErrorFallback({ error }: { error: Error }) {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <div className="p-3 rounded-full bg-red-100 text-red-600">
          <XCircle className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="text-sm text-muted-foreground">{error.message}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          Try again
        </Button>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ReportsContent />
    </ErrorBoundary>
  );
}

function ReportsContent() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfYear(subYears(new Date(), 1)),
    to: new Date(),
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const { data, isLoading } = trpc.timeReports.getAll.useQuery(
    {
      dateRange: {
        from: (dateRange.from ?? new Date()).toDateString(),
        to: (dateRange.to ?? new Date()).toDateString(),
      },
    },
    {
      retry: 3,
      retryDelay: 1000,
    }
  );

  const timeReport = data?.timeReports ?? [];
  const timeTypes = data?.timeTypes ?? [];
  const teams = data?.teams ?? [];
  const roles = data?.roles ?? [];

  const columns = createColumns();

  const table = useReactTable({
    data: timeReport,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      sorting,
      columnFilters,
      expanded,
    },
  });

  useEffect(() => {
    if (dateRange?.from) {
      table.getColumn("week")?.setFilterValue(dateRange);
    }
  }, [dateRange, table]);

  // Get filtered data for charts
  const filteredData = table
    .getFilteredRowModel()
    .rows.map((row) => row.original);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <PageHeader
          title={
            <span className="flex items-center gap-2">
              <BarChart className="h-6 w-6 text-rose-500" />
              Time Reports
            </span>
          }
          description="View and analyze time tracking reports."
        />

        <div className="sticky top-4 z-10 mb-8">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-4">
              <div className="w-72 h-10 bg-muted animate-pulse rounded-md" />
              <div className="w-48 h-10 bg-muted animate-pulse rounded-md" />
            </div>
          </div>
        </div>

        <div className="grid gap-8">
          <div className="grid gap-4 md:grid-cols-2">
            <CardSkeleton />
            <CardSkeleton />
          </div>

          <CardSkeleton />

          <TableSkeleton rows={8} cols={6} />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-semibold">No data available</h3>
          <p className="text-sm text-muted-foreground">
            Please try again later or contact support if the issue persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <BarChart className="h-6 w-6 text-rose-500" />
            Time Reports
          </span>
        }
        description="View and analyze time tracking reports."
      />

      <div className="sticky top-4 z-10">
        <TimeReportFilters
          table={table}
          dateRange={dateRange}
          setDateRange={setDateRange}
          teams={teams}
          roles={roles}
        />
      </div>

      <TimeDistributionCharts timeReport={filteredData} timeTypes={timeTypes} />

      <UtilizationIssues timeReports={filteredData} />

      <TimeReportTable table={table} timeTypes={timeTypes} />
    </div>
  );
}
