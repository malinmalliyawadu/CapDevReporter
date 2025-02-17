export interface TimeEntry {
  id: string;
  hours: number;
  timeTypeId: string;
  isCapDev: boolean;
}

export interface TimeReport {
  id: string;
  employeeId: string;
  employeeName: string;
  week: string;
  payrollId: string;
  fullHours: number;
  team: string;
  role: string;
  timeEntries: TimeReportEntry[];
}

export interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
}

export interface Role {
  id: string;
  name: string;
  description: string | null;
}

export interface TimeReportEntry {
  id: string;
  hours: number;
  timeTypeId: string;
  isCapDev: boolean;
  isLeave?: boolean;
  leaveType?: string;
  projectId?: string;
  projectName?: string;
  jiraId?: string;
  jiraUrl?: string;
  isPublicHoliday?: boolean;
  publicHolidayName?: string;
}
