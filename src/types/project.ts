export type ProjectStatus = "To Do" | "In Progress" | "In Review" | "Done";

export interface Project {
  id: number;
  issueKey: string;
  name: string;
  teamId: number;
  status: ProjectStatus;
  isCapDev: boolean;
  assigneeId: number;
  lastUpdated: string;
  jiraBoardId: string;
}
