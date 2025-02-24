"use client";

import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import type { TimeReport } from "@/types/timeReport";
import { TimeReportExpandedRow } from "./TimeReportExpandedRow";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getExpandedRowModel,
  SortingState,
  ExpandedState,
  flexRender,
} from "@tanstack/react-table";
import { createColumns } from "./TableColumns";

interface TimeReportTableProps {
  timeReports: TimeReport[];
  timeTypes: Array<{ id: string; name: string }>;
  generalTimeAssignments: Array<{
    id: string;
    roleId: string;
    timeTypeId: string;
    hoursPerWeek: number;
    timeType: {
      id: string;
      name: string;
      isCapDev: boolean;
    };
  }>;
}

export function TimeReportTable({
  timeReports,
  timeTypes,
  generalTimeAssignments,
}: TimeReportTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const columns = createColumns();

  const table = useReactTable({
    data: timeReports,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    onExpandedChange: setExpanded,
    state: {
      sorting,
      expanded,
    },
  });

  const getTimeTypeDeviations = (report: TimeReport) => {
    const roleAssignments = generalTimeAssignments.filter(
      (a) => a.roleId === report.roleId
    );

    const deviations: Array<{
      timeTypeName: string;
      expectedHours: number;
      actualHours: number;
      deviation: number;
    }> = [];

    roleAssignments.forEach((assignment) => {
      const timeEntry = report.timeEntries.find(
        (e) => e.timeTypeId === assignment.timeTypeId
      );
      const actualHours = timeEntry?.hours ?? 0;
      const deviation = actualHours - assignment.hoursPerWeek;

      if (Math.abs(deviation) > 4) {
        // Only show significant deviations
        deviations.push({
          timeTypeName: assignment.timeType.name,
          expectedHours: assignment.hoursPerWeek,
          actualHours,
          deviation,
        });
      }
    });

    return deviations;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Time Reports</CardTitle>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <React.Fragment key={row.id}>
                  <TableRow
                    className={
                      row.original.isUnderutilized
                        ? "bg-amber-50 dark:bg-amber-950/20"
                        : ""
                    }
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
                  {row.getIsExpanded() && (
                    <TableRow>
                      <TableCell colSpan={row.getVisibleCells().length}>
                        <TimeReportExpandedRow
                          report={row.original}
                          timeTypes={timeTypes}
                          deviations={getTimeTypeDeviations(row.original)}
                        />
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
