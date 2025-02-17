import { router } from "../trpc";
import { userRouter } from "./user";
import { teamRouter } from "./team";
import { projectRouter } from "./project";
import { timeEntryRouter } from "./timeEntry";
import { timeTypeRouter } from "./timeType";
import { leaveRequestRouter } from "./leaveRequest";

export const appRouter = router({
  user: userRouter,
  team: teamRouter,
  project: projectRouter,
  timeEntry: timeEntryRouter,
  timeType: timeTypeRouter,
  leaveRequest: leaveRequestRouter,
});

export type AppRouter = typeof appRouter;
