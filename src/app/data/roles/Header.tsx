import { PageHeader } from "@/components/ui/page-header";
import { Drama } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Drama className="h-7 w-7 text-purple-500" />
            <span className="bg-gradient-to-r from-purple-500 to-fuchsia-500 bg-clip-text text-transparent">
              Roles
            </span>
          </span>
        }
        description="View and manage employee roles."
      />
    </div>
  );
}
