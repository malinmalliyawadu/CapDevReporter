export interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  updatedAt: Date;
  teams: Team[];
  timeEntries: TimeEntry[];
  leaveRequests: LeaveRequest[];
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  members: User[];
  projects: Project[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string | null;
  jiraId: string;
  isCapDev: boolean;
  board: {
    team: {
      name: string;
    };
  };
  activities?: ProjectActivity[];
}

export interface TimeEntry {
  id: string;
  date: Date;
  hours: number;
  description: string | null;
  user: User;
  userId: string;
  project: Project;
  projectId: string;
  timeType: TimeType;
  timeTypeId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeType {
  id: string;
  name: string;
  description: string | null;
  timeEntries: TimeEntry[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LeaveRequest {
  id: string;
  startDate: Date;
  endDate: Date;
  status: string;
  type: string;
  description: string | null;
  user: User;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectActivity {
  activityDate: string | Date;
  jiraIssueId: string;
}
