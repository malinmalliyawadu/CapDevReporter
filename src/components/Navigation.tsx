"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import React from "react";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuContent,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./ui/navigation-menu";
import {
  ClipboardList,
  Clock,
  Drama,
  LayoutGrid,
  Palmtree,
  PartyPopper,
  RefreshCw,
  Timer,
  TimerReset,
  User,
  Users,
} from "lucide-react";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { useSyncDialog } from "@/contexts/dialog-context";

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
    href: "/team-assignments",
    description: "Assign employees to teams",
  },
  {
    title: (
      <span className="flex items-center gap-2">
        <Timer className="h-4 w-4 text-rose-500" />
        General Time
      </span>
    ),
    href: "/general-time-assignments",
    description: "Manage general time hours per week based on role",
  },
];

export function Navigation() {
  const { open: openSyncDialog } = useSyncDialog();

  return (
    <header className="bg-gradient-to-r from-white via-zinc-50 to-white dark:from-blue-800 dark:via-blue-950 dark:to-blue-900 border-b border-zinc-200 dark:border-zinc-800 dark:text-white backdrop-blur-sm sticky top-0 z-50 transition-all duration-200 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/40 before:to-white/0 dark:before:from-white/5 dark:before:to-white/0 before:pointer-events-none after:absolute after:inset-0 after:bg-gradient-to-t after:from-zinc-50/50 after:via-zinc-50/25 after:to-zinc-50/0 dark:after:from-blue-900/20 dark:after:via-blue-900/5 dark:after:to-blue-900/0 after:pointer-events-none">
      <div className="relative max-w-7xl mx-auto py-3 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div className="flex items-center gap-10">
          <div className="flex items-center gap-2.5 text-cyan-800 dark:text-white group relative">
            <div className="relative">
              <TimerReset className="h-6 w-6 transition-all duration-500 group-hover:scale-110 group-hover:rotate-180 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 dark:from-cyan-400/20 dark:to-blue-400/20 rounded-full blur-lg group-hover:scale-150 transition-transform duration-500 -z-10" />
            </div>
            <h1 className="text-2xl font-bold relative">
              <Link href="/" className="relative inline-block">
                <span className="bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-600 dark:from-cyan-400 dark:via-cyan-400 dark:to-blue-500 bg-clip-text text-transparent animate-slide-down transition-all duration-300">
                  ***REMOVED***
                </span>
                <span className="text-zinc-600 dark:text-zinc-300 ml-2 animate-slide-down transition-all duration-300">
                  Timesheet
                </span>
                <span className="absolute -bottom-0.5 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-700 via-cyan-600 to-blue-600 dark:from-cyan-400 dark:via-cyan-400 dark:to-blue-500 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300" />
              </Link>
            </h1>
          </div>

          <NavigationMenu className="relative">
            <NavigationMenuList className="gap-3">
              <NavigationMenuItem>
                <NavigationMenuTrigger className="bg-transparent hover:bg-zinc-100 dark:hover:bg-blue-800/50 transition-all duration-200 rounded-lg font-medium text-zinc-700 dark:text-zinc-200 hover:text-cyan-700 dark:hover:text-cyan-400 data-[state=open]:text-cyan-700 dark:data-[state=open]:text-cyan-400">
                  Data
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr] bg-white dark:bg-blue-950 backdrop-blur-none rounded-lg border border-zinc-200 dark:border-blue-800 shadow-sm">
                    {data.map((component) => (
                      <ListItem
                        key={component.href}
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
                <NavigationMenuTrigger className="bg-transparent hover:bg-zinc-100 dark:hover:bg-blue-800/50 transition-all duration-200 rounded-lg font-medium text-zinc-700 dark:text-zinc-200 hover:text-cyan-700 dark:hover:text-cyan-400 data-[state=open]:text-cyan-700 dark:data-[state=open]:text-cyan-400">
                  Assignments
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-6 md:w-[500px] md:grid-cols-2 lg:w-[600px] bg-white dark:bg-blue-950 backdrop-blur-none rounded-lg border border-zinc-200 dark:border-blue-800 shadow-sm">
                    {assignments.map((component) => (
                      <ListItem
                        key={component.href}
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
                <NavigationMenuLink asChild>
                  <Link
                    href="/reports"
                    className={cn(
                      "bg-transparent hover:bg-zinc-100 dark:hover:bg-blue-800/50 px-4 py-2 rounded-lg inline-flex items-center text-sm font-medium text-zinc-700 dark:text-zinc-200 hover:text-cyan-700 dark:hover:text-cyan-400 transition-all duration-200",
                      "hover:scale-105"
                    )}
                  >
                    Report
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent hover:bg-zinc-100 dark:hover:bg-blue-800/50 text-zinc-700 dark:text-zinc-200 hover:text-cyan-700 dark:hover:text-cyan-400 border-zinc-200 dark:border-blue-600 transition-all duration-200"
            onClick={() => openSyncDialog()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Sync Projects
          </Button>
          <ModeToggle />
        </div>
      </div>
    </header>
  );
}

const ListItem = ({
  className,
  title,
  children,
  href,
}: {
  className?: string;
  title: React.ReactNode;
  children: string;
  href: string;
}) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <Link
          className={cn(
            "block select-none rounded-md p-3 no-underline outline-none transition-all duration-200",
            "hover:bg-zinc-50 dark:hover:bg-blue-800/50",
            "focus:bg-accent focus:text-accent-foreground",
            "border border-transparent hover:border-zinc-200 dark:hover:border-blue-800",
            className
          )}
          href={href ?? ""}
        >
          <div className="text-sm font-medium leading-none mb-2 text-zinc-800 dark:text-zinc-200 group-hover:text-cyan-700 dark:group-hover:text-cyan-400">
            {title}
          </div>
          <p className="text-sm leading-snug text-zinc-500 dark:text-zinc-400">
            {children}
          </p>
        </Link>
      </NavigationMenuLink>
    </li>
  );
};
ListItem.displayName = "ListItem";
