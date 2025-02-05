import React from 'react';
import { Team, User } from '../types';
import { users } from '../data';

interface TeamAssignmentFormProps {
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  selectedUser: string;
  setSelectedUser: (userId: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  handleTeamAssignment: (e: React.FormEvent) => void;
  teams: Team[];
}

export function TeamAssignmentForm({
  selectedTeam,
  setSelectedTeam,
  selectedUser,
  setSelectedUser,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleTeamAssignment,
  teams,
}: TeamAssignmentFormProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Assign User to Team</h2>
      <form onSubmit={handleTeamAssignment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select User</label>
          <select
            value={selectedUser}
            onChange={(e) => setSelectedUser(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select a user...</option>
            {Object.entries(users).map(([email, user]) => (
              <option key={user.id} value={user.id}>
                {user.name} ({email})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Team</label>
          <select
            value={selectedTeam}
            onChange={(e) => setSelectedTeam(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select a team...</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Assign Team
        </button>
      </form>
    </div>
  );
}