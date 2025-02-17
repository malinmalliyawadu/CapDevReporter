"use client";

import { useState, useEffect } from "react";
import { PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  addDays,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subYears,
  isWithinInterval,
} from "date-fns";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import Holidays from "date-holidays";

interface Holiday {
  date: string;
  name: string;
  type: string;
}

function getHolidays(): Holiday[] {
  const hd = new Holidays("NZ", "WGN");
  const currentYear = new Date().getFullYear();
  const lastYear = currentYear - 2;
  const holidayList: Holiday[] = [];

  for (let year = lastYear; year <= currentYear; year++) {
    const yearHolidays = hd
      .getHolidays(year)
      .filter((h) => h.type === "public")
      .map((h) => ({
        date: h.date,
        name: h.name,
        type: h.type,
      }));
    holidayList.push(...yearHolidays);
  }

  return holidayList;
}

export default function HolidaysPage() {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subYears(new Date(), 2),
    to: new Date(),
  });
  const [holidays] = useState<Holiday[]>(getHolidays());

  const datePresets = [
    {
      label: "This Week",
      value: {
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
    },
    {
      label: "Last Two Weeks",
      value: {
        from: startOfWeek(addDays(new Date(), -14), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      },
    },
    {
      label: "This Month",
      value: {
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      },
    },
    {
      label: "This Year",
      value: {
        from: startOfYear(new Date()),
        to: endOfYear(new Date()),
      },
    },
    {
      label: "Last 2 Years",
      value: {
        from: startOfYear(subYears(new Date(), 1)),
        to: endOfYear(new Date()),
      },
    },
  ];

  const columns: ColumnDef<Holiday>[] = [
    {
      accessorKey: "date",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            Date
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        );
      },
      cell: ({ row }) =>
        new Date(row.getValue("date")).toLocaleDateString("en-NZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
      filterFn: (row) => {
        if (!dateRange?.from) return true;
        const date = new Date(row.getValue("date"));
        return isWithinInterval(date, {
          start: dateRange.from,
          end: dateRange.to || new Date(),
        });
      },
    },
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            Holiday
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        );
      },
    },
  ];

  const table = useReactTable({
    data: holidays,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  useEffect(() => {
    if (dateRange?.from) {
      table.getColumn("date")?.setFilterValue(dateRange);
    }
  }, [dateRange, table]);

  return (
    <div className="">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-pink-500" />
            Holidays
          </span>
        }
        description="View and manage public holidays."
      />

      <Card>
        <CardHeader>
          <CardTitle>Holiday Calendar</CardTitle>
          <div className="flex items-center gap-4 py-4">
            <Input
              placeholder="Search holidays..."
              value={
                (table.getColumn("name")?.getFilterValue() as string) ?? ""
              }
              onChange={(event) =>
                table.getColumn("name")?.setFilterValue(event.target.value)
              }
              className="max-w-sm"
            />
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
              presets={datePresets}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
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
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
