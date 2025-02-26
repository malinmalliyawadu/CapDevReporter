import * as React from "react";
import { Suspense } from "react";
import { PartyPopper, Calendar } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HolidaysTable } from "./HolidaysTable";
import { HolidaysTableSkeleton } from "./loading";
import Holidays from "date-holidays";
import { format } from "date-fns";

interface Holiday {
  date: string;
  name: string;
  type: string;
}

async function getHolidays(): Promise<Holiday[]> {
  const hd = new Holidays("NZ", "WGN");
  const currentDate = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

  const startYear = twelveMonthsAgo.getFullYear();
  const endYear = currentDate.getFullYear();
  const holidayList: Holiday[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = hd
      .getHolidays(year)
      .filter((h) => {
        const holidayDate = new Date(h.date);
        return (
          h.type === "public" &&
          holidayDate >= twelveMonthsAgo &&
          holidayDate <= currentDate
        );
      })
      .map((h) => ({
        date: h.date,
        name: h.name,
        type: h.type,
      }));
    holidayList.push(...yearHolidays);
  }

  return holidayList;
}

export default async function HolidaysPage() {
  const holidays = await getHolidays();
  const currentDate = new Date();
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(currentDate.getMonth() - 12);

  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <span className="relative">
              <PartyPopper className="h-8 w-8 text-pink-500" />
            </span>
            <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
              Public Holidays
            </span>
          </span>
        }
        description="View and manage public holidays for Wellington, New Zealand."
      />

      <div className="grid gap-6">
        <Card className="overflow-hidden bg-gradient-to-b from-pink-50/50 to-violet-50/50 dark:from-pink-950/10 dark:to-violet-950/10">
          <CardHeader className="space-y-1 pb-8">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl">Holiday Calendar</CardTitle>
                <CardDescription className="mt-2">
                  Showing holidays from{" "}
                  {format(twelveMonthsAgo, "MMMM d, yyyy")} to{" "}
                  {format(currentDate, "MMMM d, yyyy")}
                </CardDescription>
              </div>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-pink-100 to-violet-100 dark:from-pink-900/30 dark:to-violet-900/30">
                <Calendar className="h-8 w-8 text-pink-500" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="px-0 pb-6">
            <div className="rounded-lg bg-white/50 px-6 dark:bg-black/20">
              <Suspense fallback={<HolidaysTableSkeleton />}>
                <HolidaysTable initialHolidays={holidays} />
              </Suspense>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
