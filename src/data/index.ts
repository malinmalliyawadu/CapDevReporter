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
  {
    id: "6",
    name: "Data Science Team",
    description: "Handles data analytics and machine learning",
  },
  {
    id: "7",
    name: "Security Team",
    description: "Manages application and infrastructure security",
  },
  {
    id: "8",
    name: "Mobile Team",
    description: "Develops mobile applications",
  },
];

export const epics: Epic[] = [
  {
    id: "1",
    key: "PROJ-1",
    name: "User Authentication",
    description: "Implement user authentication system",
    isCapDev: true,
  },
  {
    id: "2",
    key: "PROJ-2",
    name: "Dashboard",
    description: "Create main dashboard interface",
    isCapDev: true,
  },
  {
    id: "3",
    key: "PROJ-3",
    name: "API Integration",
    description: "Integrate with external APIs",
    isCapDev: true,
  },
  {
    id: "4",
    key: "PROJ-4",
    name: "Performance Optimization",
    description: "Optimize application performance",
    isCapDev: false,
  },
  {
    id: "5",
    key: "PROJ-5",
    name: "Mobile App Launch",
    description: "Develop and launch mobile application",
    isCapDev: true,
  },
  {
    id: "6",
    key: "PROJ-6",
    name: "Security Audit",
    description: "Conduct comprehensive security review",
    isCapDev: false,
  },
  {
    id: "7",
    key: "PROJ-7",
    name: "Data Analytics Platform",
    description: "Build analytics dashboard and reporting",
    isCapDev: true,
  },
];

// In-memory users store
export const users: {
  email: string;
  password: string;
  id: string;
  name: string;
}[] = [
  { email: "a@a.com", password: "a", id: "1", name: "Malin Malliya Wadu" },
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
  {
    email: "sarah@example.com",
    password: "password",
    id: "4",
    name: "Sarah Johnson",
  },
  {
    email: "mike@example.com",
    password: "password",
    id: "5",
    name: "Mike Wilson",
  },
  {
    email: "emma@example.com",
    password: "password",
    id: "6",
    name: "Emma Brown",
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
  {
    id: "9b4f6d2e-3a1c-4b8d-9c7e-5f2d8e1a3b4c",
    epicId: "5",
    teamId: "8",
    startDate: "2024-06-15",
    endDate: "2025-12-31",
  },
  {
    id: "8c7b5a4d-2e1f-4c9a-8b7d-6e5f4d3c2b1a",
    epicId: "6",
    teamId: "7",
    startDate: "2024-04-01",
    endDate: "2024-12-31",
  },
  {
    id: "7d6e5f4c-1b2a-3d4e-9f8g-7h6j5k4l3m2n",
    epicId: "7",
    teamId: "6",
    startDate: "2024-07-01",
    endDate: "2025-06-30",
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
  {
    id: "9a8b7c6d-5e4f-3g2h-1i9j-8k7l6m5n4o3p",
    userId: "4",
    teamId: "6",
    startDate: "2024-05-01",
    endDate: "2026-04-30",
  },
  {
    id: "2b3c4d5e-6f7g-8h9i-1j2k-3l4m5n6o7p8q",
    userId: "5",
    teamId: "7",
    startDate: "2024-03-15",
    endDate: "2025-12-31",
  },
  {
    id: "3c4d5e6f-7g8h-9i1j-2k3l-4m5n6o7p8q9r",
    userId: "6",
    teamId: "8",
    startDate: "2024-06-01",
    endDate: "2026-05-31",
  },
];
