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
  expectedHours: number;
  isUnderutilized: boolean;
  missingHours: number;
  underutilizationReason?: string;
  team: string;
  role: string;
  roleId: string;
  deviations?: string[];
  timeEntries: TimeReportEntry[];
}

export interface TimeType {
  id: string;
  name: string;
  description: string | null;
  isCapDev: boolean;
  weeklySchedule?: string | null;
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
  date: string;
  teamName?: string;
  activityDate?: string;
  isScheduled?: boolean;
  scheduledTimeTypeName?: string;
  isRolledUp?: boolean;
  rolledUpHoursPerWeek?: number;
}
