import { TableLoading } from "@/components/loading/TableLoading";
import { PageHeader } from "@/components/ui/page-header";
import { PartyPopper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <PartyPopper className="h-6 w-6 text-yellow-500" />
            Holidays
          </span>
        }
        description="View public holidays and special dates."
      />

      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-10 w-[180px]" />
        <Skeleton className="h-10 w-[180px]" />
      </div>

      <TableLoading title="Holiday Calendar" rows={8} cols={3} />
    </div>
  );
}
