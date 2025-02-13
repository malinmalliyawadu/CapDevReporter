import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Holidays from "date-holidays";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/page-header";

interface Holiday {
  date: string;
  name: string;
  type: string;
}

export function HolidaysPage() {
  const [holidays, setHolidays] = useState<Holiday[]>([]);

  useEffect(() => {
    const hd = new Holidays("NZ", "WGN");
    const currentYear = new Date().getFullYear();
    const holidayList = hd
      .getHolidays(currentYear)
      .filter((h) => h.type === "public")
      .map((h) => ({
        date: new Date(h.date).toLocaleDateString("en-NZ", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        }),
        name: h.name,
        type: h.type,
      }));

    setHolidays(holidayList);
  }, []);

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <PageHeader
        title="Public Holidays"
        description={`Wellington, New Zealand public holidays for ${new Date().getFullYear()}`}
      />

      <Card>
        <CardHeader>
          <CardTitle>Holiday Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Holiday</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holidays.map((holiday, index) => (
                <TableRow key={index}>
                  <TableCell>{holiday.date}</TableCell>
                  <TableCell>{holiday.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
