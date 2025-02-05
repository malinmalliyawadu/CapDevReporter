import { Pencil, Trash2 } from "lucide-react";
import { Team, Epic, EpicTeamAssignment } from "../types";
import { teamAssignments, users } from "../data";

interface EpicAssignmentTableProps {
  assignments: EpicTeamAssignment[];
  teams: Team[];
  epics: Epic[];
  onEdit: (assignment: EpicTeamAssignment) => void;
  onDelete: (assignmentId: string) => void;
}

export function EpicAssignmentTable({
  assignments,
  epics,
  onEdit,
  onDelete,
}: EpicAssignmentTableProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h2 className="text-xl font-semibold mb-4">This weeks report</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Payroll ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Item
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Cap Dev
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => {
              const team = teamAssignments.find((x) => x.userId === user.id);

              return assignments
                .filter((x) => x.teamId === team?.teamId)
                .map((assignment) => {
                  const epic = epics.find((e) => e.id === assignment.epicId);
                  return (
                    <tr key={assignment.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {epic?.id} - {epic?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        10%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {epic?.isCapDev ? "Yes" : "No"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => onEdit(assignment)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onDelete(assignment.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
