import { PageHeader } from "@/components/ui/page-header";
import { ClipboardList } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <ClipboardList className="h-7 w-7 text-indigo-500" />
            <span className="bg-gradient-to-r from-indigo-500 to-blue-500 bg-clip-text text-transparent">
              Projects
            </span>
          </span>
        }
        description="Manage and view all projects"
      />
    </div>
  );
}
