"use client";

import { Button } from "@/components/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import type { TimeReport } from "@/types/timeReport";
import {
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
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
        className="group"
        data-testid="sort-button-employee"
      >
        Employee
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-employee" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown
            className="ml-2 h-4 w-4"
            data-testid="sort-icon-employee"
          />
        ) : (
          <ArrowUpDown
            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
            data-testid="sort-icon-employee"
          />
        )}
      </Button>
    ),
  },
  {
    accessorKey: "week",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="group"
        data-testid="sort-button-week"
      >
        Week
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-week" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-week" />
        ) : (
          <ArrowUpDown
            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
            data-testid="sort-icon-week"
          />
        )}
      </Button>
    ),
  },
  {
    accessorKey: "payrollId",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="group"
        data-testid="sort-button-payroll"
      >
        Payroll ID
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-payroll" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-payroll" />
        ) : (
          <ArrowUpDown
            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
            data-testid="sort-icon-payroll"
          />
        )}
      </Button>
    ),
  },
  {
    accessorKey: "fullHours",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="group"
        data-testid="sort-button-hours"
      >
        Total Hours
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-hours" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-hours" />
        ) : (
          <ArrowUpDown
            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
            data-testid="sort-icon-hours"
          />
        )}
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
        .filter((entry) => !entry.isCapDev && !entry.isLeave)
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
        className="group"
        data-testid="sort-button-team"
      >
        Team
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-team" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-team" />
        ) : (
          <ArrowUpDown
            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
            data-testid="sort-icon-team"
          />
        )}
      </Button>
    ),
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        className="group"
        data-testid="sort-button-role"
      >
        Role
        {column.getIsSorted() === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-role" />
        ) : column.getIsSorted() === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-role" />
        ) : (
          <ArrowUpDown
            className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
            data-testid="sort-icon-role"
          />
        )}
      </Button>
    ),
  },
];
