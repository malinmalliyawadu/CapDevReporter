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

interface TimeReportFiltersProps {
  teams: Array<{ id: string; name: string }>;
  roles: Array<{ id: string; name: string }>;
}

export function TimeReportFilters({ teams, roles }: TimeReportFiltersProps) {
  const defaultStartDate = startOfYear(new Date());
  const defaultEndDate = new Date();
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: defaultStartDate,
    to: defaultEndDate,
  });

  return (
    <Card>
      <CardContent className="p-4 grid gap-4 md:grid-cols-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Search</label>
          <Input
            placeholder="Search by name or payroll ID..."
            className="max-w-sm"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">Team</label>
          <Select>
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
          <Select>
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
            onDateRangeChange={setDateRange}
          />
        </div>
      </CardContent>
    </Card>
  );
}
