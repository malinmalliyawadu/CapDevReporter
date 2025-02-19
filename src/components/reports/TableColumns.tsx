"use client";

import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import type { TimeReport } from "@/types/timeReport";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
} from "lucide-react";

export const createColumns = (): ColumnDef<TimeReport>[] => [
  {
    id: "expander",
    header: () => null,
    cell: ({ row }) => {
      const isUnderutilized = row.original.isUnderutilized;
      const missingHours = row.original.missingHours;
      const reason = row.original.underutilizationReason;

      return (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={() => {
              row.toggleExpanded();
            }}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          {isUnderutilized && (
            <div
              className="text-amber-500 dark:text-amber-400"
              title={`${missingHours.toFixed(
                1
              )} hours under target\nReason: ${reason}`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "employeeName",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Employee
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "week",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Week
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "payrollId",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Payroll ID
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "fullHours",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Total Hours
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const hours = row.original.fullHours;
      const expectedHours = row.original.expectedHours;
      const isUnderutilized = row.original.isUnderutilized;
      const missingHours = row.original.missingHours;
      const reason = row.original.underutilizationReason;

      return (
        <div className="flex items-center gap-2">
          <span
            className={
              isUnderutilized
                ? "text-amber-600 dark:text-amber-400 font-medium"
                : ""
            }
          >
            {hours.toFixed(1)}
          </span>
          <span className="text-sm text-muted-foreground">
            / {expectedHours.toFixed(1)}
          </span>
          {isUnderutilized && (
            <div
              className="text-amber-500 dark:text-amber-400"
              title={`${missingHours.toFixed(
                1
              )} hours under target\nReason: ${reason}`}
            >
              <AlertTriangle className="h-4 w-4" />
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "capdevTime",
    header: "CapDev Time",
    cell: ({ row }) => {
      const capdevHours = row.original.timeEntries
        .filter((entry) => entry.isCapDev)
        .reduce((sum, entry) => sum + entry.hours, 0);
      return capdevHours.toFixed(1);
    },
  },
  {
    accessorKey: "nonCapdevTime",
    header: "Non-CapDev Time",
    cell: ({ row }) => {
      const nonCapdevHours = row.original.timeEntries
        .filter((entry) => !entry.isCapDev)
        .reduce((sum, entry) => sum + entry.hours, 0);
      return nonCapdevHours.toFixed(1);
    },
  },
  {
    accessorKey: "team",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Team
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Role
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
];
