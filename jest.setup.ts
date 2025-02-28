import "@testing-library/jest-dom";
import { mockDeep, mockReset, DeepMockProxy } from "jest-mock-extended";
import { prisma } from "@/lib/prisma";
import { PrismaClient, Prisma } from "@prisma/client";

jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prisma);
});

// Add test transaction wrapper
export const createTestContext = () => {
  let ctx = { prisma };

  const mockedPrisma = prisma as unknown as DeepMockProxy<PrismaClient>;

  beforeEach(() => {
    mockedPrisma.$transaction.mockImplementation(
      async (arg1: any, arg2?: any) => {
        if (typeof arg1 === "function") {
          // Handle the function overload
          return arg1(mockedPrisma);
        } else {
          // Handle the array overload
          return Promise.all(arg1);
        }
      }
    );
  });

  return ctx;
};

// Add test data factories
const defaultDate = new Date();

export const createMockEmployee = (overrides = {}) => ({
  id: "test-emp-id",
  name: "Test Employee",
  payrollId: "P123",
  hoursPerWeek: 40,
  roleId: "test-role-id",
  createdAt: defaultDate,
  updatedAt: defaultDate,
  role: {
    id: "test-role-id",
    name: "Developer",
    createdAt: defaultDate,
    updatedAt: defaultDate,
    description: null,
  },
  assignments: [
    {
      startDate: new Date("2024-01-01"),
      endDate: null,
      team: {
        id: "test-team-id",
        name: "Test Team",
        createdAt: defaultDate,
        updatedAt: defaultDate,
        description: null,
        jiraBoards: [],
      },
    },
  ],
  ...overrides,
});

export const createMockTimeType = (overrides = {}) => ({
  id: "test-time-type-id",
  name: "Regular Work",
  isCapDev: false,
  weeklySchedule: null,
  createdAt: defaultDate,
  updatedAt: defaultDate,
  description: null,
  ...overrides,
});

export const createMockGeneralTimeAssignment = (overrides = {}) => ({
  id: "test-gta-id",
  roleId: "test-role-id",
  timeTypeId: "test-time-type-id",
  hoursPerWeek: 40,
  createdAt: defaultDate,
  updatedAt: defaultDate,
  timeType: createMockTimeType(),
  ...overrides,
});
