import { PartyPopper } from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function HolidaysTableSkeleton() {
  return (
    <div className="rounded-lg border shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Holiday</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 10 }).map((_, index) => (
            <TableRow
              key={index}
              className={`
                transition-colors hover:bg-muted/50
                ${index % 2 === 0 ? "bg-background" : "bg-muted/20"}
              `}
            >
              <TableCell className="py-3">
                <Skeleton className="h-4 w-48" />
              </TableCell>
              <TableCell className="py-3">
                <Skeleton className="h-4 w-32" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default function Loading() {
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

      <HolidaysTableSkeleton />
    </div>
  );
}
