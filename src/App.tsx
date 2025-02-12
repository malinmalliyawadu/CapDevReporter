import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { LoginForm } from "./components/LoginForm";
import { TeamAssignmentsPage } from "./pages/TeamAssignmentsPage";
import { EpicAssignmentsPage } from "./pages/EpicAssignmentsPage";
import { GeneralTimeAssignmentsPage } from "./pages/GeneralTimeAssignmentsPage";
import { useAuth } from "./hooks/useAuth";
import { Navigation } from "./components/Navigation";
import { EmployeesPage } from "./pages/EmployeesPage";
import { RolesPage } from "./pages/RolesPage";
import { TimeTypesPage } from "./pages/TimeTypesPage";
import { TeamsPage } from "./pages/TeamsPage";
import { ReportsPage } from "./pages/ReportsPage";
import { Toaster } from "./components/ui/toaster";

function App() {
  const { user } = useAuth();

  if (!user) {
    return <LoginForm />;
  }

  return (
    <Router>
      <div className="min-h-screen">
        {user && <Navigation />}
        <Routes>
          <Route
            path="/login"
            element={user ? <Navigate to="/teams" /> : <LoginForm />}
          />
          <Route path="/teams" element={<TeamAssignmentsPage />} />
          <Route path="/epics" element={<EpicAssignmentsPage />} />
          <Route
            path="/general-time"
            element={<GeneralTimeAssignmentsPage />}
          />
          <Route path="/data/employees" element={<EmployeesPage />} />
          <Route path="/data/teams" element={<TeamsPage />} />
          <Route path="/data/roles" element={<RolesPage />} />
          <Route path="/data/general-time-types" element={<TimeTypesPage />} />
          <Route path="/capdev-report" element={<ReportsPage />} />
          <Route path="/" element={<Navigate to="/teams" />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
}

export default App;
