import { PageHeader } from "@/components/ui/page-header";
import { Users } from "lucide-react";

export const Header = () => {
  return (
    <div className="flex items-center justify-between">
      <PageHeader
        title={
          <span className="flex items-center gap-2">
            <Users className="h-7 w-7 text-blue-500" />
            <span className="bg-gradient-to-r from-blue-500 to-sky-500 bg-clip-text text-transparent">
              Teams
            </span>
          </span>
        }
        description="Manage your team structure and configure Jira board integrations for seamless project tracking."
      />
    </div>
  );
};
