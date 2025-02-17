"use client";

import { trpc } from "@/utils/trpc";

export default function Home() {
  const { data: users, isLoading: loadingUsers } = trpc.user.getAll.useQuery();
  const { data: teams, isLoading: loadingTeams } = trpc.team.getAll.useQuery();
  const { data: projects, isLoading: loadingProjects } =
    trpc.project.getAll.useQuery();

  if (loadingUsers || loadingTeams || loadingProjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Users</h2>
          <div className="text-3xl font-bold text-blue-600">
            {users?.length || 0}
          </div>
          <p className="text-gray-600 mt-2">Total registered users</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Teams</h2>
          <div className="text-3xl font-bold text-green-600">
            {teams?.length || 0}
          </div>
          <p className="text-gray-600 mt-2">Active teams</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Projects</h2>
          <div className="text-3xl font-bold text-purple-600">
            {projects?.length || 0}
          </div>
          <p className="text-gray-600 mt-2">Total projects</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Teams</h2>
          <div className="space-y-4">
            {teams?.slice(0, 5).map((team) => (
              <div key={team.id} className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">{team.name}</h3>
                  <p className="text-sm text-gray-600">{team.description}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {team.members?.length || 0} members
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Recent Projects</h2>
          <div className="space-y-4">
            {projects?.slice(0, 5).map((project) => (
              <div
                key={project.id}
                className="flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">{project.name}</h3>
                  <p className="text-sm text-gray-600">{project.description}</p>
                </div>
                <div className="text-sm text-gray-500">
                  {project.timeEntries?.length || 0} entries
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
