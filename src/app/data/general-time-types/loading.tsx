import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Header } from "./Header";

export default function Loading() {
  return (
    <div className="space-y-8">
      <Header />

      <TimeTypesTableSkeleton />
    </div>
  );
}

export function TimeTypesTableSkeleton() {
  return (
    <div>
      <div className="flex justify-end mb-4">
        <Skeleton className="h-9 w-[150px]" />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Usage Stats</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-[200px]" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-[300px]" />
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-[100px] rounded-full" />
                      <Skeleton className="h-5 w-[80px] rounded-full" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Skeleton className="h-2 w-full rounded-full" />
                      <div className="grid grid-cols-2 gap-2">
                        <Skeleton className="h-4 w-[100px]" />
                        <Skeleton className="h-4 w-[100px] justify-self-end" />
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-[80px]" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
