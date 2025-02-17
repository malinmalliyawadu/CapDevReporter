import { TimeEntry } from "./timeEntry";

export interface TimeReport {
  id: string;
  user: string;
  week: string;
  payrollId: string;
  fullHours: number;
  timeEntries: TimeEntry[];
  team: string;
  role: string;
}
