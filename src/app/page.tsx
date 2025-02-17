"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/trpc/client";
import { CalendarDays, Users, FolderKanban, Clock } from "lucide-react";

export default function Home() {
  const { data: teams, isLoading: loadingTeams } = trpc.team.getAll.useQuery();
  const { data: projects, isLoading: loadingProjects } =
    trpc.project.getAll.useQuery();
  const { data: leaveRecords, isLoading: loadingLeave } =
    trpc.leave.getAll.useQuery();
  const { data: timeEntries, isLoading: loadingTimeEntries } =
    trpc.timeEntry.getAll.useQuery();

  if (loadingTeams || loadingProjects || loadingLeave || loadingTimeEntries) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  // Calculate leave statistics
  const pendingLeave =
    leaveRecords?.filter((leave) => leave.status === "PENDING").length || 0;
  const approvedLeave =
    leaveRecords?.filter((leave) => leave.status === "APPROVED").length || 0;
  const totalLeave = leaveRecords?.length || 0;

  // Calculate project statistics
  const capDevProjects =
    projects?.filter((project) => project.isCapDev).length || 0;
  const totalProjects = projects?.length || 0;
  const capDevPercentage = totalProjects
    ? (capDevProjects / totalProjects) * 100
    : 0;

  // Get recent time entries
  const recentTimeEntries = timeEntries?.slice(0, 5) || [];

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Teams
                </p>
                <p className="text-2xl font-bold">{teams?.length || 0}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Projects
                </p>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
              </div>
              <FolderKanban className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Leave
                </p>
                <p className="text-2xl font-bold">{pendingLeave}</p>
              </div>
              <CalendarDays className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Time Entries
                </p>
                <p className="text-2xl font-bold">{timeEntries?.length || 0}</p>
              </div>
              <Clock className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Project Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Project Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">CapDev Projects</p>
                  <p className="text-sm text-muted-foreground">
                    {capDevPercentage.toFixed(1)}%
                  </p>
                </div>
                <Progress value={capDevPercentage} className="h-2" />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div>Total Projects: {totalProjects}</div>
                <div>CapDev: {capDevProjects}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Status */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Approved Leave</p>
                  <p className="text-sm text-muted-foreground">
                    {totalLeave
                      ? ((approvedLeave / totalLeave) * 100).toFixed(1)
                      : 0}
                    %
                  </p>
                </div>
                <Progress
                  value={totalLeave ? (approvedLeave / totalLeave) * 100 : 0}
                  className="h-2"
                />
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <div>Pending: {pendingLeave}</div>
                <div>Approved: {approvedLeave}</div>
                <div>Total: {totalLeave}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTimeEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{entry.employee.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {entry.project.name} - {entry.timeType.name}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">{entry.hours}h</p>
                    <p className="text-muted-foreground">
                      {new Date(entry.date).toLocaleDateString("en-NZ")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Team Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Team Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {teams?.slice(0, 5).map((team) => (
                <div
                  key={team.id}
                  className="flex justify-between items-center"
                >
                  <div>
                    <p className="font-medium">{team.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {team.description}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium">
                      {team.employees.length} members
                    </p>
                    <p className="text-muted-foreground">
                      {team.projects.length} projects
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
