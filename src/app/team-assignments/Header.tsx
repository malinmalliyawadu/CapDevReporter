import { PageHeader } from "@/components/ui/page-header";
import { LayoutGrid } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <LayoutGrid className="h-7 w-7 text-orange-500" />
            <span className="bg-gradient-to-r from-orange-500 to-yellow-500 bg-clip-text text-transparent">
              Team Assignments
            </span>
          </span>
        }
        description="Track and manage employee team assignments across your organization."
      />
    </div>
  );
}
