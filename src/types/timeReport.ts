export interface TimeEntry {
  timeTypeId: number;
  hours: number;
  isCapDev: boolean;
}

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
