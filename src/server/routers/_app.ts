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

export const appRouter = router({
  user: userRouter,
  team: teamRouter,
  project: projectRouter,
  timeEntry: timeEntryRouter,
  timeType: timeTypeRouter,
  leaveRequest: leaveRequestRouter,
  employee: employeeRouter,
  role: roleRouter,
  leave: leaveRouter,
});

export type AppRouter = typeof appRouter;
