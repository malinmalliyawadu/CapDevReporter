import { PageHeader } from "@/components/ui/page-header";
import { Clock } from "lucide-react";

export function Header() {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Clock className="h-7 w-7 text-yellow-500" />
            <span className="bg-gradient-to-r from-yellow-500 to-amber-500 bg-clip-text text-transparent">
              General Time Types
            </span>
          </span>
        }
        description="Configure organization-wide time categories and assign them to specific roles."
      />
    </div>
  );
}
