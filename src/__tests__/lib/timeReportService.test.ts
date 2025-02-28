import { getTimeReportData } from "@/lib/timeReportService";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import {
  createMockEmployee,
  createMockTimeType,
  createMockGeneralTimeAssignment,
} from "../../../jest.setup";
import {
  Employee,
  Team,
  Role,
  TimeType,
  GeneralTimeAssignment,
  Leave,
} from "@prisma/client";

// Mock the Prisma client
jest.mock("@/lib/prisma", () => ({
  __esModule: true,
  prisma: {
    employee: {
      findMany: jest.fn(),
    },
    timeType: {
      findMany: jest.fn(),
    },
    leave: {
      findMany: jest.fn(),
    },
    generalTimeAssignment: {
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
    },
  },
}));

// Mock the date-holidays library
jest.mock("date-holidays", () => {
  return jest.fn().mockImplementation(() => {
    return {
      isHoliday: jest.fn().mockReturnValue(false),
    };
  });
});

// Helper function to set up common mocks
interface MockSetupParams {
  employees?: Array<
    Employee & {
      role: Role;
      assignments: Array<{
        startDate: Date;
        endDate: Date | null;
        team: Team & {
          jiraBoards: Array<unknown>; // We can expand this if needed
        };
      }>;
    }
  >;
  teams?: Array<Team>;
  roles?: Array<Role>;
  timeTypes?: Array<TimeType>;
  generalAssignments?: Array<
    GeneralTimeAssignment & {
      timeType: TimeType;
    }
  >;
  leaves?: Array<Leave>;
}

const setupCommonMocks = ({
  employees = [],
  teams = [],
  roles = [],
  timeTypes = [],
  generalAssignments = [],
  leaves = [],
}: MockSetupParams = {}) => {
  (prisma.employee.findMany as jest.Mock).mockResolvedValue(employees);
  (prisma.team.findMany as jest.Mock).mockResolvedValue(teams);
  (prisma.role.findMany as jest.Mock).mockResolvedValue(roles);
  (prisma.timeType.findMany as jest.Mock).mockResolvedValue(timeTypes);
  (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
    generalAssignments
  );
  (prisma.leave.findMany as jest.Mock).mockResolvedValue(leaves);
};

describe("timeReportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTimeReportData", () => {
    it("should return time report data with default parameters", async () => {
      // Mock data using factories
      const mockEmployee = createMockEmployee();
      const mockTimeType = createMockTimeType();
      const mockGTA = createMockGeneralTimeAssignment();

      // Setup mocks using helper
      setupCommonMocks({
        employees: [mockEmployee],
        teams: [mockEmployee.assignments[0].team],
        roles: [mockEmployee.role],
        timeTypes: [mockTimeType],
        generalAssignments: [mockGTA],
        leaves: [],
      });

      // Call the function
      const result = await getTimeReportData({
        from: new Date(),
        to: new Date(),
      });

      // Assertions
      expect(result).toBeDefined();
      expect(result.timeReports).toHaveLength(1);

      const report = result.timeReports[0];
      expect(report.employeeId).toBe(mockEmployee.id);
      expect(report.employeeName).toBe(mockEmployee.name);
      expect(report.team).toBe(mockEmployee.assignments[0].team.name);
    });

    it("should handle scheduled time types correctly", async () => {
      // Mock data using factories with scheduled time type
      const mockEmployee = createMockEmployee();
      const mockTimeType = createMockTimeType({
        name: "Friday Training",
        isCapDev: true,
        weeklySchedule: '{ "days": ["friday"] }',
      });
      const mockGTA = createMockGeneralTimeAssignment({
        timeType: mockTimeType,
        hoursPerWeek: 8,
      });

      // Setup mocks using helper
      setupCommonMocks({
        employees: [mockEmployee],
        teams: [mockEmployee.assignments[0].team],
        roles: [mockEmployee.role],
        timeTypes: [mockTimeType],
        generalAssignments: [mockGTA],
      });

      // Test for a week containing Friday
      const result = await getTimeReportData({
        from: new Date("2024-01-19"), // Friday
        to: new Date("2024-01-19"),
      });

      // Assertions
      expect(result.timeReports[0].timeEntries).toContainEqual(
        expect.objectContaining({
          timeTypeId: mockTimeType.id,
          hours: 8,
          isScheduled: true,
          date: "2024-01-19",
        })
      );
    });

    it("should handle leaves correctly", async () => {
      // Mock data
      const mockEmployee = createMockEmployee();
      const leaveDate = new Date("2024-01-15"); // Monday
      const mockLeave = {
        id: "leave1",
        employeeId: mockEmployee.id,
        duration: 8,
        type: "Vacation",
        date: leaveDate,
        status: "APPROVED",
      };

      // Setup mocks using helper
      setupCommonMocks({
        employees: [mockEmployee],
        teams: [mockEmployee.assignments[0].team],
        roles: [mockEmployee.role],
        leaves: [mockLeave],
      });

      // Test for the week containing the leave
      const result = await getTimeReportData({
        from: new Date("2024-01-15"),
        to: new Date("2024-01-15"),
      });

      // Assertions
      const timeEntries = result.timeReports[0].timeEntries;
      expect(timeEntries).toContainEqual(
        expect.objectContaining({
          date: format(leaveDate, "yyyy-MM-dd"),
          hours: 8,
          isLeave: true,
          leaveType: "Vacation",
        })
      );
    });

    it("should handle errors gracefully", async () => {
      // Mock a database error
      (prisma.employee.findMany as jest.Mock).mockRejectedValue(
        new Error("Database error")
      );

      // Verify that the error is handled properly
      await expect(
        getTimeReportData({
          from: new Date(),
          to: new Date(),
        })
      ).rejects.toThrow("Database error");
    });

    it("should filter by search term correctly", async () => {
      // Mock data
      const mockEmployee = createMockEmployee({
        name: "John Doe",
        payrollId: "P123",
      });

      // Setup mocks using helper
      setupCommonMocks({
        employees: [mockEmployee],
        teams: [mockEmployee.assignments[0].team],
        roles: [mockEmployee.role],
      });

      // Call with search parameter
      await getTimeReportData({
        from: new Date(),
        to: new Date(),
        search: "John",
      });

      // Verify the search parameter was used
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                OR: [
                  { name: { contains: "John" } },
                  { payrollId: { contains: "John" } },
                ],
              },
            ]),
          }),
        })
      );
    });

    it("should validate date range", async () => {
      // Setup minimal mocks using helper
      setupCommonMocks();

      // Test invalid date range (to before from)
      const result = await getTimeReportData({
        from: new Date("2024-01-15"),
        to: new Date("2024-01-01"),
      });

      // Expect empty results for invalid date range
      expect(result.timeReports).toHaveLength(0);
    });

    it("should handle multiple employees with different assignments", async () => {
      const employee1 = createMockEmployee({
        id: "emp1",
        name: "Employee 1",
        assignments: [
          {
            startDate: new Date("2024-01-01"),
            endDate: null,
            team: { id: "team1", name: "Team A", jiraBoards: [] },
          },
        ],
      });

      const employee2 = createMockEmployee({
        id: "emp2",
        name: "Employee 2",
        assignments: [
          {
            startDate: new Date("2024-01-01"),
            endDate: new Date("2024-01-15"),
            team: { id: "team2", name: "Team B", jiraBoards: [] },
          },
          {
            startDate: new Date("2024-01-16"),
            endDate: null,
            team: { id: "team3", name: "Team C", jiraBoards: [] },
          },
        ],
      });

      // Setup mocks using helper
      setupCommonMocks({
        employees: [employee1, employee2],
        teams: [
          employee1.assignments[0].team,
          employee2.assignments[0].team,
          employee2.assignments[1].team,
        ],
        roles: [{ id: "test-role-id", name: "Developer" }],
      });

      const result = await getTimeReportData({
        from: new Date("2024-01-01"),
        to: new Date("2024-01-31"),
      });

      // Group reports by employee
      const emp1Reports = result.timeReports.filter(
        (r) => r.employeeId === "emp1"
      );
      const emp2Reports = result.timeReports.filter(
        (r) => r.employeeId === "emp2"
      );

      // Each employee should have reports for each week
      expect(emp1Reports.length).toBe(5); // 5 weeks in January 2024
      expect(emp2Reports.length).toBe(5);

      // Check employee 1's team assignment (should be consistent)
      expect(emp1Reports.every((r) => r.team === "Team A")).toBe(true);

      // Check employee 2's team changes
      const emp2TeamProgression = emp2Reports.map((r) => r.team);
      expect(emp2TeamProgression).toEqual([
        "Team B", // Week 1 (Jan 1-7)
        "Team B", // Week 2 (Jan 8-14)
        "Team B, Team C", // Week 3 (Jan 15-21, transition week)
        "Team C", // Week 4 (Jan 22-28)
        "Team C", // Week 5 (Jan 29-31)
      ]);
    });

    it("should handle holidays correctly", async () => {
      // Mock the date-holidays to return true for a specific date
      const mockHolidays = jest.requireMock("date-holidays");
      mockHolidays.mockImplementation(() => ({
        isHoliday: (date: Date) => {
          const dateStr = format(date, "yyyy-MM-dd");
          if (dateStr === "2024-01-15") {
            return [
              {
                name: "Test Holiday",
                type: "public",
              },
            ];
          }
          return false;
        },
      }));

      const mockEmployee = createMockEmployee();
      const regularWork = createMockTimeType({
        id: "regular",
        name: "Regular Work",
      });
      const leaveType = createMockTimeType({
        id: "leave",
        name: "Leave",
      });

      // Setup mocks using helper
      setupCommonMocks({
        employees: [mockEmployee],
        teams: [mockEmployee.assignments[0].team],
        roles: [mockEmployee.role],
        timeTypes: [regularWork, leaveType],
        generalAssignments: [
          createMockGeneralTimeAssignment({ timeType: regularWork }),
        ],
      });

      const result = await getTimeReportData({
        from: new Date("2024-01-15"),
        to: new Date("2024-01-15"),
      });

      const timeEntries = result.timeReports[0].timeEntries;
      const holidayEntry = timeEntries.find(
        (e) => e.isPublicHoliday && e.date === "2024-01-15"
      );

      expect(holidayEntry).toBeDefined();
      expect(holidayEntry?.hours).toBe(8);
      expect(holidayEntry?.publicHolidayName).toBe("Test Holiday");
    });
  });
});
