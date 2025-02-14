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
import {
  Users,
  User,
  Clock,
  ClipboardList,
  PartyPopper,
  Palmtree,
  Timer,
  LayoutGrid,
  Drama,
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";

const data: { title: React.ReactNode; href: string; description: string }[] = [
  {
    title: (
      <span className="flex items-center gap-2">
        <Users className="h-4 w-4 text-blue-500" />
        Teams
      </span>
    ),
    href: "/data/teams",
    description: "Manage teams",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <User className="h-4 w-4 text-green-500" />
        Employees
      </span>
    ),
    href: "/data/employees",
    description: "Manage employees",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <Drama className="h-4 w-4 text-purple-500" />
        Roles
      </span>
    ),
    href: "/data/roles",
    description: "Manage roles",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        General Time Types
      </span>
    ),
    href: "/data/general-time-types",
    description: "Manage general time types",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <ClipboardList className="h-4 w-4 text-indigo-500" />
        Projects
      </span>
    ),
    href: "/data/projects",
    description: "View and sync projects",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <PartyPopper className="h-4 w-4 text-pink-500" />
        Holidays
      </span>
    ),
    href: "/data/holidays",
    description: "View public holidays",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <Palmtree className="h-4 w-4 text-teal-500" />
        Leave
      </span>
    ),
    href: "/data/leave",
    description: "View and sync leave",
  },
];

const assignments: {
  title: React.ReactNode;
  href: string;
  description: string;
}[] = [
  {
    title: (
      <span className="flex items-center gap-2">
        <LayoutGrid className="h-4 w-4 text-orange-500" />
        Team Assignments
      </span>
    ),
    href: "/teams",
    description: "Assign employees to teams",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-rose-500" />
        General Time
      </span>
    ),
    href: "/general-time",
    description: "Manage general time hours per week based on role",
  },
];

export function Navigation() {
  return (
    <header className="bg-gradient-to-r from-zinc-50 to-zinc-100 border-b border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 dark:text-white dark:from-blue-800 dark:to-blue-900">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 text-cyan-800 dark:text-white">
            <Timer className="animate-spin-once" />
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

        <ModeToggle />
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
