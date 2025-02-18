"use client";

import { Table } from "@tanstack/react-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRange } from "react-day-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subWeeks,
  subMonths,
  subYears,
} from "date-fns";
import type { TimeReport } from "@/types/timeReport";

interface TimeReportFiltersProps {
  table: Table<TimeReport>;
  dateRange: DateRange;
  setDateRange: (range: DateRange) => void;
  teams: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
}

const datePresets = [
  {
    label: "This Week",
    value: {
      from: startOfWeek(new Date(), { weekStartsOn: 1 }),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }),
    },
  },
  {
    label: "Last Week",
    value: {
      from: startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
      to: endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 }),
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
    label: "Last Month",
    value: {
      from: startOfMonth(subMonths(new Date(), 1)),
      to: endOfMonth(subMonths(new Date(), 1)),
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

export function TimeReportFilters({
  table,
  dateRange,
  setDateRange,
  teams,
  roles,
}: TimeReportFiltersProps) {
  const handleFilterChange = (columnId: string, value: string) => {
    const filterValue = value === "All" ? undefined : value;
    table.getColumn(columnId)?.setFilterValue(filterValue);
  };

  const teamValue =
    (table.getColumn("team")?.getFilterValue() as string) ?? "All";
  const roleValue =
    (table.getColumn("role")?.getFilterValue() as string) ?? "All";

  return (
    <Card className="mb-6 shadow-lg bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Filter employees..."
            value={
              (table.getColumn("employeeName")?.getFilterValue() as string) ??
              ""
            }
            onChange={(event) =>
              table
                .getColumn("employeeName")
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={(range) => {
              if (range) {
                setDateRange(range);
              }
            }}
            presets={datePresets}
          />
          <Select
            value={teamValue}
            onValueChange={(value) => handleFilterChange("team", value)}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by team">
                {teamValue === "All" ? "All Teams" : teamValue}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.name}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={roleValue}
            onValueChange={(value) => handleFilterChange("role", value)}
          >
            <SelectTrigger className="max-w-sm">
              <SelectValue placeholder="Filter by role">
                {roleValue === "All" ? "All Roles" : roleValue}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
