import { AdminTimeAssignment } from "@/types/adminTimeAssignment";

const generalTimeAssignments: AdminTimeAssignment[] = [
  {
    id: 1,
    roleId: 1, // Software Engineer
    hoursPerWeek: 4,
    timeTypeId: 1,
  },
  {
    id: 2,
    roleId: 1, // Software Engineer
    hoursPerWeek: 2,
    timeTypeId: 2,
  },
  {
    id: 3,
    roleId: 1, // Software Engineer
    hoursPerWeek: 4,
    timeTypeId: 3,
  },
  {
    id: 4,
    roleId: 2, // UX Designer
    hoursPerWeek: 4,
    timeTypeId: 1,
  },
  {
    id: 5,
    roleId: 2, // UX Designer
    hoursPerWeek: 2,
    timeTypeId: 4,
  },
  {
    id: 6,
    roleId: 3, // Product Manager
    hoursPerWeek: 8,
    timeTypeId: 5,
  },
  {
    id: 7,
    roleId: 3, // Product Manager
    hoursPerWeek: 4,
    timeTypeId: 1,
  },
  {
    id: 8,
    roleId: 4, // QA Engineer
    hoursPerWeek: 4,
    timeTypeId: 1,
  },
  {
    id: 9,
    roleId: 4, // QA Engineer
    hoursPerWeek: 3,
    timeTypeId: 6,
  },
  {
    id: 10,
    roleId: 5, // Operations Engineer
    hoursPerWeek: 4,
    timeTypeId: 1,
  },
  {
    id: 11,
    roleId: 5, // Operations Engineer
    hoursPerWeek: 8,
    timeTypeId: 7,
  },
  {
    id: 12,
    roleId: 6, // Architect
    hoursPerWeek: 6,
    timeTypeId: 8,
  },
  {
    id: 13,
    roleId: 7, // Scrum Master
    hoursPerWeek: 15,
    timeTypeId: 9,
  },
  {
    id: 14,
    roleId: 8, // Product Owner
    hoursPerWeek: 8,
    timeTypeId: 10,
  },
  {
    id: 15,
    roleId: 8, // Product Owner
    hoursPerWeek: 6,
    timeTypeId: 5,
  },
];

export { generalTimeAssignments };
