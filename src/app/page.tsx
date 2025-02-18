"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
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
  const currentDate = new Date();
  const employeesWithoutTeams = timeReports.timeReports.filter(
    (report) => report.team === "Unassigned"
  );

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Issues Dashboard</h1>

      {/* Key Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card
          className={
            teamsWithoutBoards.length > 0
              ? "border-amber-500 dark:border-amber-400"
              : ""
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Teams Without Boards
                </p>
                <p className="text-2xl font-bold">
                  {teamsWithoutBoards.length}
                </p>
              </div>
              <FolderX className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            teamsWithoutProjects.length > 0
              ? "border-amber-500 dark:border-amber-400"
              : ""
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Teams Without Projects
                </p>
                <p className="text-2xl font-bold">
                  {teamsWithoutProjects.length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            employeesWithMissingHours.length > 0
              ? "border-red-500 dark:border-red-400"
              : ""
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Missing Hours This Week
                </p>
                <p className="text-2xl font-bold">
                  {employeesWithMissingHours.length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card
          className={
            employeesWithoutTeams.length > 0
              ? "border-red-500 dark:border-red-400"
              : ""
          }
        >
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Unassigned Employees
                </p>
                <p className="text-2xl font-bold">
                  {employeesWithoutTeams.length}
                </p>
              </div>
              <UserX className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Issues */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Teams Without Boards */}
        {teamsWithoutBoards.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderX className="h-5 w-5 text-amber-500" />
                Teams Without Boards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamsWithoutBoards.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {team.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Teams Without Projects */}
        {teamsWithoutProjects.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-500" />
                Teams Without Projects
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {teamsWithoutProjects.map((team) => (
                  <div
                    key={team.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{team.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Has {team.jiraBoards.length} board(s)
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employees With Missing Hours */}
        {employeesWithMissingHours.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Missing Hours This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeesWithMissingHours.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{report.employeeName}</p>
                      <p className="text-sm text-muted-foreground">
                        {report.missingHours.toFixed(1)} hours under target
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {report.underutilizationReason}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Employees Without Teams */}
        {employeesWithoutTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-500" />
                Unassigned Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {employeesWithoutTeams.map((report) => (
                  <div
                    key={report.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{report.employeeName}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {report.role}
                        </p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-muted-foreground">
                          {report.payrollId}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/team-assignments?employee=${report.employeeId}`}
                      className="shrink-0"
                    >
                      <Button variant="outline" size="sm">
                        Assign to Team
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
