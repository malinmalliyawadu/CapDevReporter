import { PageHeader } from "@/components/ui/page-header";
import { Clock } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-cyan-500" />
            <span className="bg-gradient-to-r from-cyan-500 to-blue-500 bg-clip-text text-transparent">
              General Time Assignments
            </span>
          </span>
        }
        description="Manage default time type allocations for each role."
      />
    </div>
  );
}
