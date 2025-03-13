import { PageHeader } from "@/components/ui/page-header";
import { PartyPopper } from "lucide-react";

export function Header() {
  return (
    <PageHeader
      title={
        <span className="flex items-center gap-3">
          <span className="relative">
            <PartyPopper className="h-8 w-8 text-pink-500" />
          </span>
          <span className="bg-gradient-to-r from-pink-500 via-purple-500 to-violet-500 bg-clip-text text-transparent">
            Public Holidays
          </span>
        </span>
      }
      description="View and manage public holidays for Wellington, New Zealand."
    />
  );
}
