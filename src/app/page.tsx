import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, UserX, FolderX, AlertCircle } from "lucide-react";
import { startOfWeek, endOfWeek } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

interface TimeReport {
  id: string;
  employeeName: string;
  employeeId: string;
  fullHours: number;
  expectedHours: number;
  isUnderutilized: boolean;
  missingHours: number;
  team: string;
  role: string;
  timeEntries: Array<{
    id: string;
    timeTypeId: string;
    hours: number;
    isCapDev: boolean;
  }>;
}

async function getDashboardData() {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const endDate = endOfWeek(new Date(), { weekStartsOn: 1 });

  const [teams, timeEntries] = await Promise.all([
    prisma.team.findMany({
      include: {
        jiraBoards: {
          include: {
            projects: true,
          },
        },
      },
    }),
    prisma.timeEntry.findMany({
      where: {
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        employee: {
          include: {
            role: true,
            assignments: {
              where: {
                startDate: {
                  lte: endDate,
                },
                OR: [{ endDate: null }, { endDate: { gte: startDate } }],
              },
              include: {
                team: true,
              },
              orderBy: {
                startDate: "desc",
              },
              take: 1,
            },
          },
        },
        timeType: true,
      },
    }),
  ]);

  // Group time entries by employee
  const timeReports = Object.values(
    timeEntries.reduce<Record<string, TimeReport>>((acc, entry) => {
      const key = entry.employee.id;
      if (!acc[key]) {
        const currentTeam = entry.employee.assignments[0]?.team;
        acc[key] = {
          id: key,
          employeeName: entry.employee.name,
          employeeId: entry.employee.id,
          fullHours: 0,
          expectedHours: entry.employee.hoursPerWeek,
          isUnderutilized: false,
          missingHours: 0,
          team: currentTeam?.name ?? "Unassigned",
          role: entry.employee.role.name,
          timeEntries: [],
        };
      }

      acc[key].timeEntries.push({
        id: entry.id,
        timeTypeId: entry.timeType.id,
        hours: entry.hours,
        isCapDev: entry.timeType.isCapDev,
      });

      acc[key].fullHours += entry.hours;
      acc[key].isUnderutilized = acc[key].fullHours < acc[key].expectedHours;
      acc[key].missingHours = Math.max(
        0,
        acc[key].expectedHours - acc[key].fullHours
      );

      return acc;
    }, {})
  );

  return { teams, timeReports };
}

export default async function Home() {
  const { teams, timeReports } = await getDashboardData();

  // Teams without Jira boards
  const teamsWithoutBoards = teams.filter(
    (team) => team.jiraBoards.length === 0
  );

  // Teams with no active projects this week
  const teamsWithoutProjects = teams.filter((team) =>
    team.jiraBoards.every((board) => board.projects.length === 0)
  );

  // Employees with missing hours this week
  const employeesWithMissingHours = timeReports.filter(
    (report) => report.isUnderutilized
  );

  // Employees not assigned to teams (check current assignments)
  const employeesWithoutTeams = timeReports.filter(
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
                        {report.fullHours.toFixed(1)} / {report.expectedHours}{" "}
                        hours logged
                      </div>
                      <div className="text-sm text-yellow-600">
                        {report.missingHours.toFixed(1)} hours under target
                      </div>
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
