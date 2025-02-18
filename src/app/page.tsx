"use client";

import { Card, CardContent } from "@/components/ui/card";
import { trpc } from "@/trpc/client";
import { AlertTriangle, UserX, FolderX, AlertCircle } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: teams } = trpc.team.getAll.useQuery();
  const { data: timeReports } = trpc.timeReports.getAll.useQuery({
    dateRange: {
      from: startOfWeek(new Date(), { weekStartsOn: 1 }).toDateString(),
      to: endOfWeek(new Date(), { weekStartsOn: 1 }).toDateString(),
    },
  });

  if (!teams || !timeReports) {
    return null;
  }

  // Teams without Jira boards
  const teamsWithoutBoards = teams.filter(
    (team) => team.jiraBoards.length === 0
  );

  // Teams with no active projects this week
  const teamsWithoutProjects = teams.filter((team) =>
    team.jiraBoards.every((board) => board.projects.length === 0)
  );

  // Employees with missing hours this week
  const employeesWithMissingHours = timeReports.timeReports.filter(
    (report) => report.isUnderutilized
  );

  // Employees not assigned to teams (check current assignments)
  const employeesWithoutTeams = timeReports.timeReports.filter(
    (report) => report.team === "Unassigned"
  );

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Issues Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Unassigned Employees</h3>
              </div>
              <div className="space-y-4">
                {employeesWithoutTeams.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{report.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.role}
                      </div>
                    </div>
                    <Link href="/team-assignments">
                      <Button variant="outline" size="sm">
                        Assign Team
                      </Button>
                    </Link>
                  </div>
                ))}
                {employeesWithoutTeams.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    All employees are assigned to teams
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <FolderX className="h-5 w-5 text-orange-500" />
                <h3 className="text-lg font-semibold">
                  Teams Without Projects
                </h3>
              </div>
              <div className="space-y-4">
                {teamsWithoutProjects.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">
                        No active projects
                      </div>
                    </div>
                    <Link href="/data/projects">
                      <Button variant="outline" size="sm">
                        View Projects
                      </Button>
                    </Link>
                  </div>
                ))}
                {teamsWithoutProjects.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    All teams have active projects
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
                <h3 className="text-lg font-semibold">Missing Hours</h3>
              </div>
              <div className="space-y-4">
                {employeesWithMissingHours.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{report.employeeName}</div>
                      <div className="text-sm text-muted-foreground">
                        {report.fullHours} / {report.expectedHours} hours logged
                      </div>
                      {report.underutilizationReason && (
                        <div className="text-sm text-yellow-600">
                          {report.underutilizationReason}
                        </div>
                      )}
                    </div>
                    <Link href="/reports">
                      <Button variant="outline" size="sm">
                        View Reports
                      </Button>
                    </Link>
                  </div>
                ))}
                {employeesWithMissingHours.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    All employees have logged their hours
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                <h3 className="text-lg font-semibold">Teams Without Boards</h3>
              </div>
              <div className="space-y-4">
                {teamsWithoutBoards.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-2">
                      <div className="font-medium">{team.name}</div>
                      <div className="text-sm text-muted-foreground">
                        No Jira boards configured
                      </div>
                    </div>
                    <Link href="/data/teams">
                      <Button variant="outline" size="sm">
                        Configure Boards
                      </Button>
                    </Link>
                  </div>
                ))}
                {teamsWithoutBoards.length === 0 && (
                  <div className="text-sm text-muted-foreground">
                    All teams have Jira boards configured
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
