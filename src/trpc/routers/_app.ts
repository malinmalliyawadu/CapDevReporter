import { teamRouter } from "./team";
import { projectRouter } from "./project";
import { timeEntryRouter } from "./timeEntry";
import { timeTypeRouter } from "./timeType";
import { employeeRouter } from "./employee";
import { roleRouter } from "./role";
import { leaveRouter } from "./leave";
import { timeReportsRouter } from "./timeReports";
import { employeesRouter } from "./employees";
import { generalTimeAssignmentsRouter } from "./generalTimeAssignments";
import { createTRPCRouter } from "../init";

export const appRouter = createTRPCRouter({
  team: teamRouter,
  project: projectRouter,
  timeEntry: timeEntryRouter,
  timeType: timeTypeRouter,
  employee: employeeRouter,
  employees: employeesRouter,
  role: roleRouter,
  leave: leaveRouter,
  timeReports: timeReportsRouter,
  generalTimeAssignments: generalTimeAssignmentsRouter,
});

export type AppRouter = typeof appRouter;
