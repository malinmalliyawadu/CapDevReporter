import React from "react";
import { Team, Epic } from "../types";

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
      <h2 className="text-xl font-semibold mb-4">
        Generate report for time range
      </h2>
      <form onSubmit={handleEpicTeamAssignment} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              End Date
            </label>
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
          Generate report
        </button>
      </form>
    </div>
  );
}
