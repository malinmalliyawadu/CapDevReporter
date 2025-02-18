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
import { BarChart } from "lucide-react";
import { DateRange } from "react-day-picker";
import { startOfYear } from "date-fns";
import { trpc } from "@/trpc/client";
import { PageHeader } from "@/components/ui/page-header";
import { TimeReportFilters } from "@/components/reports/TimeReportFilters";
import { TimeDistributionCharts } from "@/components/reports/TimeDistributionCharts";
import { TimeReportTable } from "@/components/reports/TimeReportTable";
import { UtilizationIssues } from "@/components/reports/UtilizationIssues";
import { createColumns } from "@/components/reports/TableColumns";

export default function ReportsPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();
  const [dateRange, setDateRange] = useState<DateRange>({
    from: defaultStartDate,
    to: defaultEndDate,
  });

  const [data] = trpc.timeReports.getAll.useSuspenseQuery({
    dateRange: {
      from: (dateRange.from ?? defaultStartDate).toDateString(),
      to: (dateRange.to ?? defaultEndDate).toDateString(),
    },
  });

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
