import { useNavigate } from "react-router-dom";
import { ListTodo, LogOut } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export function EpicAssignmentsPage() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Epic Assignments</h1>
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate("/teams")}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            <ListTodo className="h-4 w-4 mr-2" />
            View Teams
          </button>
          <button
            onClick={signOut}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
