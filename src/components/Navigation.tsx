import * as React from "react";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { Link } from "react-router-dom";
import { TimerReset } from "lucide-react";

const data: { title: string; href: string; description: string }[] = [
  {
    title: "Teams",
    href: "/data/teams",
    description: "Manage teams",
  },
  {
    title: "Employees",
    href: "/data/employees",
    description: "Manage employees",
  },
  {
    title: "Roles",
    href: "/data/roles",
    description: "Manage roles",
  },
  {
    title: "General Time Types",
    href: "/data/general-time-types",
    description: "Manage general time types",
  },
  {
    title: "Projects",
    href: "/data/projects",
    description: "View and sync projects",
  },
  {
    title: "Holidays",
    href: "/data/holidays",
    description: "View public holidays",
  },
  {
    title: "Leave",
    href: "/data/leave",
    description: "View and sync leave",
  },
];

const assignments: { title: string; href: string; description: string }[] = [
  {
    title: "Teams",
    href: "/teams",
    description: "Assign employees to teams",
  },
  {
    title: "General Time",
    href: "/general-time",
    description: "Manage general time hours per week based on role",
  },
];

export function Navigation() {
  return (
    <header className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b border-zinc-200">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex">
        <div className="flex items-center justify-between mr-8 gap-2 text-cyan-800">
          <TimerReset className="animate-spin-once" />
          <h1 className="text-2xl font-bold tracking-tight animate-slide-down">
            ***REMOVED*** Timesheet
          </h1>
        </div>
        <NavigationMenu>
          <NavigationMenuList className="gap-2">
            <NavigationMenuItem>
              <NavigationMenuTrigger>Data</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid gap-3 p-4 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                  {data.map((component) => (
                    <ListItem
                      key={component.title}
                      title={component.title}
                      href={component.href}
                    >
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuTrigger>Assignments</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px] ">
                  {assignments.map((component) => (
                    <ListItem
                      key={component.title}
                      title={component.title}
                      href={component.href}
                    >
                      {component.description}
                    </ListItem>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/capdev-report">
                <NavigationMenuLink className={navigationMenuTriggerStyle()}>
                  Report
                </NavigationMenuLink>
              </Link>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
}

const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, href }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          to={href ?? ""}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-gray-500">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";
