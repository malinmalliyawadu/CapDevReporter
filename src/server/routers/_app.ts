import { router } from "../trpc";
import { userRouter } from "./user";
import { teamRouter } from "./team";
import { projectRouter } from "./project";
import { timeEntryRouter } from "./timeEntry";
import { timeTypeRouter } from "./timeType";
import { leaveRequestRouter } from "./leaveRequest";
import { employeeRouter } from "./employee";
import { roleRouter } from "./role";
import { leaveRouter } from "./leave";
import { timeReportsRouter } from "./timeReports";
import { employeesRouter } from "./employees";
import { generalTimeAssignmentsRouter } from "./generalTimeAssignments";

export const appRouter = router({
  user: userRouter,
  team: teamRouter,
  project: projectRouter,
  timeEntry: timeEntryRouter,
  timeType: timeTypeRouter,
  leaveRequest: leaveRequestRouter,
  employee: employeeRouter,
  employees: employeesRouter,
  role: roleRouter,
  leave: leaveRouter,
  timeReports: timeReportsRouter,
  generalTimeAssignments: generalTimeAssignmentsRouter,
});

export type AppRouter = typeof appRouter;
