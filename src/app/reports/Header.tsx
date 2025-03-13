import { PageHeader } from "@/components/ui/page-header";
import { BarChart } from "lucide-react";

export function Header() {
  return (
    <PageHeader
      title={
        <span className="flex items-center gap-2">
          <BarChart className="h-7 w-7 text-rose-500" />
          <span className="bg-gradient-to-r from-rose-500 to-red-500 bg-clip-text text-transparent">
            Time Reports
          </span>
        </span>
      }
      description="View and analyze time tracking data."
    />
  );
}
