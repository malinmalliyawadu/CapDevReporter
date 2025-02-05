import React from 'react';
import { Team, Epic } from '../types';

interface EpicAssignmentFormProps {
  selectedTeam: string;
  setSelectedTeam: (team: string) => void;
  selectedEpic: string;
  setSelectedEpic: (epic: string) => void;
  startDate: string;
  setStartDate: (date: string) => void;
  endDate: string;
  setEndDate: (date: string) => void;
  handleEpicTeamAssignment: (e: React.FormEvent) => void;
  teams: Team[];
  epics: Epic[];
}

export function EpicAssignmentForm({
  selectedTeam,
  setSelectedTeam,
  selectedEpic,
  setSelectedEpic,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  handleEpicTeamAssignment,
  teams,
  epics,
}: EpicAssignmentFormProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold mb-4">Assign Team to Epic</h2>
      <form onSubmit={handleEpicTeamAssignment} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select Epic</label>
          <select
            value={selectedEpic}
            onChange={(e) => setSelectedEpic(e.target.value)}
            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
          >
            <option value="">Select an epic...</option>
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.key} - {epic.name}
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
          Assign Team to Epic
        </button>
      </form>
    </div>
  );
}