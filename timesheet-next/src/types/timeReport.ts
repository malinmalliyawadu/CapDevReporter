export interface TimeEntry {
  id: string;
  hours: number;
  timeTypeId: string;
  isCapDev: boolean;
}

export interface TimeReport {
  id: string;
  userId: string;
  user: string;
  week: string;
  payrollId: string;
  fullHours: number;
  team: string;
  role: string;
  timeEntries: TimeEntry[];
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
