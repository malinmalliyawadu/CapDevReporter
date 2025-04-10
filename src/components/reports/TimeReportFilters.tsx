"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subMonths,
  addDays,
} from "date-fns";
import type { DateRange } from "react-day-picker";
import { useSearchParams } from "next/navigation";

// Custom hook for debouncing values
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface TimeReportFiltersProps {
  teams: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
  onFilterUpdate: (params: URLSearchParams) => void;
}

export function TimeReportFilters({
  teams,
  roles,
  onFilterUpdate,
}: TimeReportFiltersProps) {
  const searchParams = useSearchParams();
  const params = new URLSearchParams(searchParams.toString());

  // Initialize state from URL params
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: searchParams.get("from")
      ? new Date(searchParams.get("from")!)
      : defaultStartDate,
    to: searchParams.get("to")
      ? new Date(searchParams.get("to")!)
      : defaultEndDate,
  });

  // Add local state for search input
  const [searchInput, setSearchInput] = useState(
    searchParams.get("search") ?? ""
  );
  const debouncedSearch = useDebounce(searchInput, 300); // 300ms delay

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
  ];

  const updateFilters = (key: string, value: string | undefined | null) => {
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }

    onFilterUpdate(params);
  };

  // Apply debounced search
  useEffect(
    () => {
      if (debouncedSearch) {
        params.set("search", debouncedSearch);
      } else {
        params.delete("search");
      }

      onFilterUpdate(params);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [debouncedSearch, onFilterUpdate]
  );

  // Handle date range changes
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange);

    const params = new URLSearchParams(searchParams.toString());

    if (newRange?.from) {
      params.set("from", newRange.from.toISOString());
    } else {
      params.delete("from");
    }

    if (newRange?.to) {
      params.set("to", newRange.to.toISOString());
    } else {
      params.delete("to");
    }

    onFilterUpdate(params);
  };

  return (
    <Card className="relative">
      <CardContent className="p-4 grid gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search by name or payroll ID..."
            className="max-w-sm"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="team" className="text-sm font-medium">
            Team
          </label>
          <Select
            value={searchParams.get("team") ?? "all"}
            onValueChange={(value) => updateFilters("team", value)}
          >
            <SelectTrigger id="team">
              <SelectValue placeholder="All teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All teams</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="role" className="text-sm font-medium">
            Role
          </label>
          <Select
            value={searchParams.get("role") ?? "all"}
            onValueChange={(value) => updateFilters("role", value)}
          >
            <SelectTrigger id="role">
              <SelectValue placeholder="All roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="date-range" className="text-sm font-medium">
            Date Range
          </label>
          <DateRangePicker
            triggerId="date-range"
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            presets={datePresets}
          />
        </div>
      </CardContent>
    </Card>
  );
}
