import { Team, Epic } from "../types";

// In-memory data store
export const teams: Team[] = [
  {
    id: "1",
    name: "Frontend Team",
    description: "Responsible for user interface development",
  },
  {
    id: "2",
    name: "Backend Team",
    description: "Handles server-side logic and APIs",
  },
  {
    id: "3",
    name: "DevOps Team",
    description: "Manages deployment and infrastructure",
  },
  {
    id: "4",
    name: "Design Team",
    description: "Creates user experience and visual design",
  },
  {
    id: "5",
    name: "QA Team",
    description: "Ensures product quality and testing",
  },
];

export const epics: Epic[] = [
  {
    id: "1",
    key: "PROJ-1",
    name: "User Authentication",
    description: "Implement user authentication system",
  },
  {
    id: "2",
    key: "PROJ-2",
    name: "Dashboard",
    description: "Create main dashboard interface",
  },
  {
    id: "3",
    key: "PROJ-3",
    name: "API Integration",
    description: "Integrate with external APIs",
  },
  {
    id: "4",
    key: "PROJ-4",
    name: "Performance Optimization",
    description: "Optimize application performance",
  },
];

// In-memory users store
export const users: {
  email: string;
  password: string;
  id: string;
  name: string;
}[] = [
  { email: "a@a.com", password: "a", id: "1", name: "Admin User" },
  {
    email: "john@example.com",
    password: "password",
    id: "2",
    name: "John Doe",
  },
  {
    email: "jane@example.com",
    password: "password",
    id: "3",
    name: "Jane Smith",
  },
];

export const epicAssingments = [
  {
    id: "7743eb67-dfbc-48fa-89a5-9c9c2e0328ae",
    epicId: "1",
    teamId: "4",
    startDate: "2023-03-03",
    endDate: "2026-08-11",
  },
  {
    id: "6ba82fed-c73b-45bf-9bf5-3c24f268dace",
    epicId: "2",
    teamId: "4",
    startDate: "2024-09-20",
    endDate: "2025-09-17",
  },
  {
    id: "f4d71a98-ddb6-43d0-805e-121ed1b19d77",
    epicId: "3",
    teamId: "2",
    startDate: "2023-11-01",
    endDate: "2025-05-27",
  },
  {
    id: "b5fce06d-c6fc-4a5c-a723-d5063874dc12",
    epicId: "4",
    teamId: "1",
    startDate: "2024-02-14",
    endDate: "2027-05-27",
  },
  {
    id: "e6556465-8e1f-4809-bc96-f0a751615f75",
    epicId: "1",
    teamId: "5",
    startDate: "2022-05-27",
    endDate: "2026-05-22",
  },
];

export const teamAssignments = [
  {
    id: "1ce21857-a8ed-4e14-8cc6-035cb8ca17d2",
    userId: "1",
    teamId: "2",
    startDate: "2024-09-07",
    endDate: "2026-01-08",
  },
  {
    id: "4a461981-dd33-4496-b774-044ecf5f02f2",
    userId: "2",
    teamId: "3",
    startDate: "2024-01-15",
    endDate: "2027-10-06",
  },
  {
    id: "816ee6e0-6fb2-4692-af71-170b3d6cc064",
    userId: "3",
    teamId: "2",
    startDate: "2024-07-20",
    endDate: "2027-04-15",
  },
  {
    id: "352e706c-0298-462a-9a75-712c76eed33f",
    userId: "1",
    teamId: "2",
    startDate: "2023-03-14",
    endDate: "2027-09-28",
  },
  {
    id: "866b21a7-431e-41fc-86c0-f9244567e387",
    userId: "2",
    teamId: "4",
    startDate: "2023-04-18",
    endDate: "2026-03-19",
  },
];
