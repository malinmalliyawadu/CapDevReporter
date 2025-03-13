import { PageHeader } from "@/components/ui/page-header";
import { LeaveSyncClient } from "./LeaveSyncClient";
import { Palmtree } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Palmtree className="h-8 w-8 text-teal-500" />
            <span className="bg-gradient-to-r from-teal-500 to-cyan-500 bg-clip-text text-transparent text-3xl font-bold">
              Leave
            </span>
          </span>
        }
        description="View and manage employee leave records"
      />
      <LeaveSyncClient />
    </div>
  );
}
