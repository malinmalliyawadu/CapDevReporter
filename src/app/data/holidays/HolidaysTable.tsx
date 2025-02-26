"use client";

import { useState, useEffect } from "react";
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

interface Holiday {
  date: string;
  name: string;
  type: string;
}

interface HolidaysTableProps {
  initialHolidays: Holiday[];
}

export function HolidaysTable({ initialHolidays }: HolidaysTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subYears(new Date(), 2),
    to: new Date(),
  });

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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
          data-testid="sort-button-date"
        >
          Date
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-date" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-date" />
          ) : (
            <ArrowUpDown
              className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
              data-testid="sort-icon-date"
            />
          )}
        </Button>
      ),
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
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
          data-testid="sort-button-name"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-name" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-name" />
          ) : (
            <ArrowUpDown
              className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
              data-testid="sort-icon-name"
            />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "type",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
          data-testid="sort-button-type"
        >
          Type
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" data-testid="sort-icon-type" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" data-testid="sort-icon-type" />
          ) : (
            <ArrowUpDown
              className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100"
              data-testid="sort-icon-type"
            />
          )}
        </Button>
      ),
    },
  ];

  const table = useReactTable({
    data: initialHolidays,
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
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 py-2">
        <Input
          placeholder="Search holidays..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm transition-all duration-200 focus:ring-2 focus:ring-pink-500"
        />
        <DateRangePicker
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          presets={datePresets}
        />
      </div>

      <div className="rounded-lg border shadow-sm">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="font-semibold">
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
              table.getRowModel().rows.map((row, index) => (
                <TableRow
                  key={row.id}
                  className={`
                    transition-colors hover:bg-muted/50
                    ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}
                  `}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {cell.column.id === "name" ? (
                        <span className="font-medium text-pink-600">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </span>
                      ) : (
                        flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-32 text-center animate-pulse"
                >
                  No holidays found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
