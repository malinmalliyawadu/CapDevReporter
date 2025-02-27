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
      <T>(fn: (prisma: Prisma.TransactionClient) => Promise<T>) =>
        fn(mockedPrisma)
    );
  });

  return ctx;
};

// Add test data factories
export const createMockEmployee = (overrides = {}) => ({
  id: "test-emp-id",
  name: "Test Employee",
  payrollId: "P123",
  hoursPerWeek: 40,
  roleId: "test-role-id",
  role: { id: "test-role-id", name: "Developer" },
  assignments: [
    {
      startDate: new Date("2024-01-01"),
      endDate: null,
      team: {
        id: "test-team-id",
        name: "Test Team",
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
  ...overrides,
});

export const createMockGeneralTimeAssignment = (overrides = {}) => ({
  id: "test-gta-id",
  roleId: "test-role-id",
  timeTypeId: "test-time-type-id",
  hoursPerWeek: 40,
  timeType: createMockTimeType(),
  ...overrides,
});
