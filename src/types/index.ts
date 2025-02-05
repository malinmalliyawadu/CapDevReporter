export interface User {
  id: string;
  email: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
}

export interface TeamAssignment {
  id: string;
  userId: string;
  teamId: string;
  startDate: string;
  endDate: string;
}

export interface Epic {
  id: string;
  key: string;
  name: string;
  description: string;
  isCapDev: boolean;
}

export interface EpicTeamAssignment {
  id: string;
  epicId: string;
  teamId: string;
  startDate: string;
  endDate: string;
}
