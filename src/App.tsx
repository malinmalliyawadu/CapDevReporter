import React, { useEffect, useState } from "react";
import { LogOut, Layers, ArrowLeft } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { LoginForm } from "./components/LoginForm";
import { TeamAssignmentForm } from "./components/TeamAssignmentForm";
import { EpicAssignmentForm } from "./components/EpicAssignmentForm";
import { AssignmentTable } from "./components/AssignmentTable";
import { EpicAssignmentTable } from "./components/EpicAssignmentTable";
import { teams, epics, users, teamAssignments, epicAssingments } from "./data";
import { User, TeamAssignment, EpicTeamAssignment } from "./types";

// In-memory assignments store
let assignments: TeamAssignment[] = teamAssignments;
let epicAssignments: EpicTeamAssignment[] = epicAssingments;

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [selectedUser, setSelectedUser] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [allAssignments, setAllAssignments] = useState<TeamAssignment[]>([]);
  const [showEpicAssignments, setShowEpicAssignments] = useState(false);
  const [selectedEpic, setSelectedEpic] = useState("");
  const [epicTeamAssignments, setEpicTeamAssignments] = useState<
    EpicTeamAssignment[]
  >([]);
  const [editingAssignment, setEditingAssignment] =
    useState<TeamAssignment | null>(null);
  const [editingEpicAssignment, setEditingEpicAssignment] =
    useState<EpicTeamAssignment | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssignments();
      fetchEpicAssignments();
    }
  }, [user]);

  const fetchAssignments = () => {
    setAllAssignments(assignments);
  };

  const fetchEpicAssignments = () => {
    setEpicTeamAssignments(epicAssignments);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (users.find((x) => x.email === email)) {
      toast.error("User already exists");
      setLoading(false);
      return;
    }

    const userId = Math.random().toString(36).substring(2);
    users.push({
      password,
      id: userId,
      name: email.split("@")[0],
      email: email,
    });
    toast.success("Account created successfully");
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const userRecord = users.find((x) => x.email === email);
    if (!userRecord || userRecord.password !== password) {
      toast.error("Invalid credentials");
      setLoading(false);
      return;
    }

    setUser({ id: userRecord.id, email });
    toast.success("Signed in successfully");
    setLoading(false);
  };

  const handleSignOut = () => {
    setUser(null);
    setAllAssignments([]);
    setShowEpicAssignments(false);
    toast.success("Signed out successfully");
  };

  const handleTeamAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedUser || !startDate || !endDate) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingAssignment) {
      // Update existing assignment
      assignments = assignments.map((a) =>
        a.id === editingAssignment.id
          ? {
              ...a,
              teamId: selectedTeam,
              userId: selectedUser,
              startDate,
              endDate,
            }
          : a
      );
      toast.success("Assignment updated successfully");
      setEditingAssignment(null);
    } else {
      // Create new assignment
      const newAssignment: TeamAssignment = {
        id: Math.random().toString(36).substring(2),
        userId: selectedUser,
        teamId: selectedTeam,
        startDate,
        endDate,
      };
      assignments.push(newAssignment);
      toast.success("Team assigned successfully");
    }

    fetchAssignments();
    setSelectedTeam("");
    setSelectedUser("");
    setStartDate("");
    setEndDate("");
  };

  const handleEpicTeamAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeam || !selectedEpic || !startDate || !endDate) {
      toast.error("Please fill in all fields");
      return;
    }

    if (editingEpicAssignment) {
      // Update existing epic assignment
      epicAssignments = epicAssignments.map((a) =>
        a.id === editingEpicAssignment.id
          ? {
              ...a,
              teamId: selectedTeam,
              epicId: selectedEpic,
              startDate,
              endDate,
            }
          : a
      );
      toast.success("Epic assignment updated successfully");
      setEditingEpicAssignment(null);
    } else {
      // Create new epic assignment
      const newAssignment: EpicTeamAssignment = {
        id: Math.random().toString(36).substring(2),
        epicId: selectedEpic,
        teamId: selectedTeam,
        startDate,
        endDate,
      };
      epicAssignments.push(newAssignment);
      toast.success("Team assigned to epic successfully");
    }

    fetchEpicAssignments();
    setSelectedTeam("");
    setSelectedEpic("");
    setStartDate("");
    setEndDate("");
  };

  const handleEditAssignment = (assignment: TeamAssignment) => {
    setEditingAssignment(assignment);
    setSelectedTeam(assignment.teamId);
    setSelectedUser(assignment.userId);
    setStartDate(assignment.startDate);
    setEndDate(assignment.endDate);
  };

  const handleDeleteAssignment = (assignmentId: string) => {
    assignments = assignments.filter((a) => a.id !== assignmentId);
    fetchAssignments();
    toast.success("Assignment deleted successfully");
  };

  const handleEditEpicAssignment = (assignment: EpicTeamAssignment) => {
    setEditingEpicAssignment(assignment);
    setSelectedTeam(assignment.teamId);
    setSelectedEpic(assignment.epicId);
    setStartDate(assignment.startDate);
    setEndDate(assignment.endDate);
  };

  const handleDeleteEpicAssignment = (assignmentId: string) => {
    epicAssignments = epicAssignments.filter((a) => a.id !== assignmentId);
    fetchEpicAssignments();
    toast.success("Epic assignment deleted successfully");
  };

  if (!user) {
    return (
      <LoginForm
        email={email}
        setEmail={setEmail}
        password={password}
        setPassword={setPassword}
        loading={loading}
        handleSignIn={handleSignIn}
        handleSignUp={handleSignUp}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            {showEpicAssignments && (
              <button
                onClick={() => {
                  setShowEpicAssignments(false);
                  setEditingEpicAssignment(null);
                  setSelectedTeam("");
                  setSelectedEpic("");
                  setStartDate("");
                  setEndDate("");
                }}
                className="inline-flex items-center text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5 mr-1" />
                Back to Team Assignments
              </button>
            )}
            <h1 className="text-3xl font-bold text-gray-900">
              {showEpicAssignments ? "Timesheet Report" : "Team Assignments"}
            </h1>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={() => {
                setShowEpicAssignments(!showEpicAssignments);
                setEditingAssignment(null);
                setEditingEpicAssignment(null);
                setSelectedTeam("");
                setSelectedUser("");
                setSelectedEpic("");
                setStartDate("");
                setEndDate("");
              }}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Layers className="h-4 w-4 mr-2" />
              {showEpicAssignments ? "View Team Assignments" : "View report"}
            </button>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </button>
          </div>
        </div>

        {showEpicAssignments ? (
          <>
            <EpicAssignmentForm
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              selectedEpic={selectedEpic}
              setSelectedEpic={setSelectedEpic}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              handleEpicTeamAssignment={handleEpicTeamAssignment}
              teams={teams}
              epics={epics}
            />
            <EpicAssignmentTable
              assignments={epicTeamAssignments}
              teams={teams}
              epics={epics}
              onEdit={handleEditEpicAssignment}
              onDelete={handleDeleteEpicAssignment}
            />
          </>
        ) : (
          <>
            <TeamAssignmentForm
              selectedTeam={selectedTeam}
              setSelectedTeam={setSelectedTeam}
              selectedUser={selectedUser}
              setSelectedUser={setSelectedUser}
              startDate={startDate}
              setStartDate={setStartDate}
              endDate={endDate}
              setEndDate={setEndDate}
              handleTeamAssignment={handleTeamAssignment}
              teams={teams}
            />
            <AssignmentTable
              assignments={allAssignments}
              teams={teams}
              onEdit={handleEditAssignment}
              onDelete={handleDeleteAssignment}
            />
          </>
        )}
      </div>
      <iframe
        src="https://***REMOVED***.atlassian.net/secure/PlanEmbeddedReport.jspa?r=5BgPG"
        width="1024"
        height="640"
        style={{ border: "1px solid #ccc" }}
      ></iframe>
      <Toaster position="top-right" />
    </div>
  );
}

export default App;
