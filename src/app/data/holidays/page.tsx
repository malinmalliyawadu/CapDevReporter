import * as React from "react";
import { Suspense } from "react";
import { PartyPopper } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";
import { HolidaysTable } from "./HolidaysTable";
import { HolidaysTableSkeleton } from "./loading";
import Holidays from "date-holidays";

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

  return (
    <div className="space-y-6">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <PartyPopper className="h-7 w-7 text-pink-500" />
            <span className="bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
              Holidays
            </span>
          </span>
        }
        description="View and manage public holidays."
      />

      <Card>
        <CardHeader>
          <CardTitle>Public Holidays</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<HolidaysTableSkeleton />}>
            <HolidaysTable initialHolidays={holidays} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
