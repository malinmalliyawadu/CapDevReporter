import { getTimeReportData } from "@/lib/timeReportService";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Holidays from "date-holidays";
import {
  createMockEmployee,
  createMockTimeType,
  createMockGeneralTimeAssignment,
} from "../../../jest.setup";

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

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.assignments[0].team,
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.role,
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([mockTimeType]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue([
        mockGTA,
      ]);
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);

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

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.assignments[0].team,
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.role,
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([mockTimeType]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue([
        mockGTA,
      ]);
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);

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

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.assignments[0].team,
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.role,
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        []
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([mockLeave]);

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

      // Setup mocks with initial data
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([mockEmployee]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.assignments[0].team,
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        mockEmployee.role,
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        []
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);

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
  });
});
