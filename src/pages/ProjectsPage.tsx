import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Project {
  issueKey: string;
  name: string;
  team: string;
  status: "To Do" | "In Progress" | "In Review" | "Done";
  isCapDev: boolean;
  assignee?: string;
  lastUpdated: string;
}

export function ProjectsPage() {
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [projects, setProjects] = useState<Project[]>([
    {
      issueKey: "PROJ-123",
      name: "Implement SSO Authentication",
      team: "Engineering",
      status: "In Progress",
      isCapDev: true,
      assignee: "John Doe",
      lastUpdated: "2024-03-15T10:30:00Z",
    },
    {
      issueKey: "PROJ-124",
      name: "Dashboard Redesign",
      team: "Design",
      status: "In Review",
      isCapDev: false,
      assignee: "Jane Smith",
      lastUpdated: "2024-03-14T15:45:00Z",
    },
    {
      issueKey: "PROJ-125",
      name: "API Performance Optimization",
      team: "Engineering",
      status: "To Do",
      isCapDev: true,
      assignee: "Alice Johnson",
      lastUpdated: "2024-03-13T09:20:00Z",
    },
    {
      issueKey: "PROJ-126",
      name: "User Onboarding Flow",
      team: "Product",
      status: "Done",
      isCapDev: false,
      assignee: "Bob Wilson",
      lastUpdated: "2024-03-12T16:15:00Z",
    },
  ]);

  const getStatusColor = (status: Project["status"]) => {
    const colors = {
      "To Do": "bg-slate-500",
      "In Progress": "bg-blue-500",
      "In Review": "bg-yellow-500",
      Done: "bg-green-500",
    };
    return colors[status];
  };

  const columns: ColumnDef<Project>[] = [
    {
      accessorKey: "issueKey",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="group"
          >
            Issue
            {column.getIsSorted() === "asc" ? (
              <ArrowUp className="ml-2 h-4 w-4" />
            ) : column.getIsSorted() === "desc" ? (
              <ArrowDown className="ml-2 h-4 w-4" />
            ) : (
              <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </Button>
        );
      },
      filterFn: (row, id, value) => {
        return row
          .getValue(id)
          .toString()
          .toLowerCase()
          .includes((value as string).toLowerCase());
      },
      cell: ({ row }) => (
        <a
          href={`https://your-jira-instance.atlassian.net/browse/${row.getValue(
            "issueKey"
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-500 hover:underline"
        >
          {row.getValue("issueKey")}
        </a>
      ),
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
        >
          Name
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
          )}
        </Button>
      ),
    },
    {
      accessorKey: "team",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
        >
          Team
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
          )}
        </Button>
      ),
      filterFn: "equals",
    },
    {
      accessorKey: "status",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
        >
          Status
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
          )}
        </Button>
      ),
      filterFn: "equals",
      cell: ({ row }) => (
        <Badge className={getStatusColor(row.getValue("status"))}>
          {row.getValue("status")}
        </Badge>
      ),
    },
    {
      accessorKey: "isCapDev",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
        >
          Type
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
          )}
        </Button>
      ),
      filterFn: "equals",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isCapDev") ? "default" : "secondary"}>
          {row.getValue("isCapDev") ? "CapDev" : "BAU"}
        </Badge>
      ),
    },
    {
      accessorKey: "lastUpdated",
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="group"
        >
          Last Updated
          {column.getIsSorted() === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : column.getIsSorted() === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100" />
          )}
        </Button>
      ),
      cell: ({ row }) =>
        new Date(row.getValue("lastUpdated")).toLocaleDateString("en-NZ"),
    },
  ];

  const table = useReactTable({
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  const handleSync = async () => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setLastSynced(new Date());
    } catch (error) {
      console.error("Failed to sync project data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIssueSearch = (term: string) => {
    table.getColumn("issueKey")?.setFilterValue(term);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Project tracking from Jira</p>
        </div>
        <div className="flex items-center gap-4">
          {lastSynced && (
            <span className="text-sm text-muted-foreground">
              Last synced: {lastSynced.toLocaleString("en-NZ")}
            </span>
          )}
          <Button onClick={handleSync} disabled={isLoading}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
            />
            Sync with Jira
          </Button>
        </div>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search by issue key..."
          value={
            (table.getColumn("issueKey")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) => handleIssueSearch(event.target.value)}
          className="max-w-xs"
        />

        <Select
          value={(table.getColumn("team")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table
              .getColumn("team")
              ?.setFilterValue(value === "All" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by team" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Teams</SelectItem>
            <SelectItem value="Engineering">Engineering</SelectItem>
            <SelectItem value="Design">Design</SelectItem>
            <SelectItem value="Product">Product</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
          onValueChange={(value) =>
            table
              .getColumn("status")
              ?.setFilterValue(value === "All" ? "" : value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="To Do">To Do</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="In Review">In Review</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={
            (table.getColumn("isCapDev")?.getFilterValue() as string) ?? ""
          }
          onValueChange={(value) =>
            table
              .getColumn("isCapDev")
              ?.setFilterValue(
                value === "All" ? "" : value === "true" ? true : false
              )
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Types</SelectItem>
            <SelectItem value="true">CapDev</SelectItem>
            <SelectItem value="false">BAU</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Project List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id}>
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
