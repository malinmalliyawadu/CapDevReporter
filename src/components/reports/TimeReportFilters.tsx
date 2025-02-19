"use client";

import React, { useState } from "react";
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
import { startOfYear } from "date-fns";
import type { DateRange } from "react-day-picker";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface TimeReportFiltersProps {
  teams: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
}

export function TimeReportFilters({ teams, roles }: TimeReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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

  // Update URL when filters change
  const updateFilters = (key: string, value: string | undefined | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  // Handle date range changes
  const handleDateRangeChange = (newRange: DateRange | undefined) => {
    setDateRange(newRange);
    if (newRange?.from) {
      updateFilters("from", newRange.from.toISOString());
    }
    if (newRange?.to) {
      updateFilters("to", newRange.to.toISOString());
    }
  };

  return (
    <Card>
      <CardContent className="p-4 grid gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search by name or payroll ID..."
            className="max-w-sm"
            value={searchParams.get("search") ?? ""}
            onChange={(e) => updateFilters("search", e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Team</label>
          <Select
            value={searchParams.get("team") ?? "all"}
            onValueChange={(value) => updateFilters("team", value)}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">Role</label>
          <Select
            value={searchParams.get("role") ?? "all"}
            onValueChange={(value) => updateFilters("role", value)}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">Date Range</label>
          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
