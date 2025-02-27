import { getTimeReportData } from "@/lib/timeReportService";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";

// Mock the prisma client
jest.mock("@/lib/prisma", () => ({
  prisma: {
    employee: {
      findMany: jest.fn(),
    },
    team: {
      findMany: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
    },
    timeType: {
      findMany: jest.fn(),
    },
    generalTimeAssignment: {
      findMany: jest.fn(),
    },
    leave: {
      findMany: jest.fn(),
    },
    projectActivity: {
      findMany: jest.fn(),
    },
  },
}));

describe("timeReportService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getTimeReportData", () => {
    it("should return time report data with default parameters", async () => {
      // Mock data
      const mockEmployees = [
        {
          id: "emp1",
          name: "John Doe",
          payrollId: "P001",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { name: "Developer", id: "role1" },
          assignments: [
            {
              team: { id: "team1", name: "Team A" },
            },
          ],
        },
      ];

      const mockTeams = [{ id: "team1", name: "Team A" }];
      const mockRoles = [{ id: "role1", name: "Developer" }];
      const mockTimeTypes = [
        { id: "tt1", name: "Leave", isCapDev: false },
        { id: "tt2", name: "CapDev", isCapDev: true },
        { id: "tt3", name: "Non-CapDev", isCapDev: false },
      ];
      const mockGeneralTimeAssignments: any[] = [];
      const mockLeaves = [
        {
          id: "leave1",
          employeeId: "emp1",
          duration: 8,
          type: "Vacation",
          date: new Date("2023-01-15"),
        },
      ];
      const mockProjectActivities = [
        {
          id: "activity1",
          activityDate: new Date("2023-01-16"),
          jiraIssueId: "JIRA-123",
          project: {
            id: "proj1",
            name: "Project X",
            isCapDev: true,
            board: {
              teamId: "team1",
            },
          },
        },
      ];

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      (prisma.team.findMany as jest.Mock).mockResolvedValue(mockTeams);
      (prisma.role.findMany as jest.Mock).mockResolvedValue(mockRoles);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue(mockLeaves);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue(
        mockProjectActivities
      );

      // Call the function with default dates
      const result = await getTimeReportData({
        from: new Date("2023-01-01"),
        to: new Date("2023-12-31"),
      });

      // Assertions
      expect(result.timeReports).toHaveLength(1);
      expect(result.timeReports[0].employeeName).toBe("John Doe");
      expect(result.timeReports[0].payrollId).toBe("P001");
      expect(result.timeReports[0].team).toBe("Team A");
      expect(result.timeReports[0].role).toBe("Developer");

      // Check time entries
      expect(result.timeReports[0].timeEntries).toHaveLength(2);

      // Check leave entry
      const leaveEntry = result.timeReports[0].timeEntries.find(
        (e) => e.isLeave
      );
      expect(leaveEntry).toBeDefined();
      expect(leaveEntry?.hours).toBe(8);
      expect(leaveEntry?.leaveType).toBe("Vacation");
      expect(leaveEntry?.date).toBe(
        format(new Date("2023-01-15"), "yyyy-MM-dd")
      );

      // Check project entry
      const projectEntry = result.timeReports[0].timeEntries.find(
        (e) => e.projectId
      );
      expect(projectEntry).toBeDefined();
      expect(projectEntry?.hours).toBe(8);
      expect(projectEntry?.projectName).toBe("Project X");
      expect(projectEntry?.isCapDev).toBe(true);
      expect(projectEntry?.jiraId).toBe("JIRA-123");
      expect(projectEntry?.date).toBe(
        format(new Date("2023-01-16"), "yyyy-MM-dd")
      );

      // Check hours calculation
      expect(result.timeReports[0].fullHours).toBe(16); // 8 hours leave + 8 hours project
      expect(result.timeReports[0].expectedHours).toBe(40);
      expect(result.timeReports[0].isUnderutilized).toBe(true);
      expect(result.timeReports[0].missingHours).toBe(24); // 40 - 16 = 24

      // Check other returned data
      expect(result.teams).toEqual(mockTeams);
      expect(result.roles).toEqual(mockRoles);
      expect(result.timeTypes).toHaveLength(3);
    });

    it("should apply scheduled time types on specific weekdays", async () => {
      // Mock data with a Friday scheduled time type
      // January 13, 2023 was a Friday
      const testDate = new Date("2023-01-13");
      const formattedTestDate = format(testDate, "yyyy-MM-dd");

      const mockEmployees = [
        {
          id: "emp1",
          name: "John Doe",
          payrollId: "P001",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { name: "Developer", id: "role1" },
          assignments: [
            {
              team: { id: "team1", name: "Team A" },
            },
          ],
        },
      ];

      const mockTimeTypes = [
        {
          id: "tt1",
          name: "Friday Training",
          isCapDev: true,
          weeklySchedule: '{ "days": ["friday"] }',
        },
        {
          id: "tt2",
          name: "Regular Work",
          isCapDev: false,
        },
      ];

      const mockGeneralTimeAssignments = [
        {
          id: "gta1",
          roleId: "role1",
          timeTypeId: "tt1",
          hoursPerWeek: 8,
          timeType: {
            id: "tt1",
            name: "Friday Training",
            isCapDev: true,
          },
        },
      ];

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with a date range that includes the Friday
      const result = await getTimeReportData({
        from: new Date("2023-01-09"), // Monday
        to: new Date("2023-01-15"), // Sunday
      });

      // Assertions
      expect(result.timeReports).toHaveLength(1);

      // Check for the scheduled entry
      const scheduledEntries = result.timeReports[0].timeEntries.filter(
        (entry) => entry.isScheduled
      );

      expect(scheduledEntries).toHaveLength(1);
      expect(scheduledEntries[0].timeTypeId).toBe("tt1");
      expect(scheduledEntries[0].date).toBe(formattedTestDate);
      expect(scheduledEntries[0].scheduledTimeTypeName).toBe("Friday Training");
      expect(scheduledEntries[0].isCapDev).toBe(true);
      expect(scheduledEntries[0].hours).toBe(8); // Hours from general time assignment

      // Check total hours
      expect(result.timeReports[0].fullHours).toBe(8); // Just the scheduled entry
    });

    it("should apply 1-hour Friday Update for January 1-15, 2025", async () => {
      // January 3 and January 10, 2025 are Fridays
      const firstFriday = new Date("2025-01-03");
      const secondFriday = new Date("2025-01-10");
      const formattedFirstFriday = format(firstFriday, "yyyy-MM-dd");
      const formattedSecondFriday = format(secondFriday, "yyyy-MM-dd");

      const mockEmployees = [
        {
          id: "emp1",
          name: "Jane Smith",
          payrollId: "P002",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { name: "Developer", id: "role1" },
          assignments: [
            {
              team: { id: "team1", name: "Team A" },
            },
          ],
        },
      ];

      const mockTimeTypes = [
        {
          id: "tt1",
          name: "Friday Update",
          isCapDev: false,
          weeklySchedule: '{ "days": ["friday"] }',
        },
        {
          id: "tt2",
          name: "Regular Work",
          isCapDev: false,
        },
      ];

      const mockGeneralTimeAssignments = [
        {
          id: "gta1",
          roleId: "role1",
          timeTypeId: "tt1",
          hoursPerWeek: 1,
          timeType: {
            id: "tt1",
            name: "Friday Update",
            isCapDev: false,
          },
        },
      ];

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        { id: "team1", name: "Team A" },
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        { id: "role1", name: "Developer" },
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with the date range January 1-15, 2025 (includes two Fridays)
      const result = await getTimeReportData({
        from: new Date("2025-01-01"), // Wednesday
        to: new Date("2025-01-15"), // Wednesday (two weeks later)
      });

      // Assertions
      expect(result.timeReports).toHaveLength(1);

      // Check all time entries
      const allEntries = result.timeReports[0].timeEntries;

      // Should have two entries (one for each Friday)
      expect(allEntries).toHaveLength(2);

      // Verify the first Friday Update entry
      const firstFridayEntry = allEntries.find(
        (entry) => entry.date === formattedFirstFriday
      );
      expect(firstFridayEntry).toBeDefined();
      expect(firstFridayEntry?.isScheduled).toBe(true);
      expect(firstFridayEntry?.timeTypeId).toBe("tt1");
      expect(firstFridayEntry?.scheduledTimeTypeName).toBe("Friday Update");
      expect(firstFridayEntry?.hours).toBe(1);
      // Also check that activityDate is set to the Friday
      expect(firstFridayEntry?.activityDate).toBe(formattedFirstFriday);

      // Verify the second Friday Update entry
      const secondFridayEntry = allEntries.find(
        (entry) => entry.date === formattedSecondFriday
      );
      expect(secondFridayEntry).toBeDefined();
      expect(secondFridayEntry?.isScheduled).toBe(true);
      expect(secondFridayEntry?.timeTypeId).toBe("tt1");
      expect(secondFridayEntry?.scheduledTimeTypeName).toBe("Friday Update");
      expect(secondFridayEntry?.hours).toBe(1);
      // Also check that activityDate is set to the Friday
      expect(secondFridayEntry?.activityDate).toBe(formattedSecondFriday);

      // Check total hours - should be 2 hours (1 hour for each Friday)
      expect(result.timeReports[0].fullHours).toBe(2);
    });

    it("should apply only one Friday Update for January 1-3, 2025", async () => {
      // January 3, 2025 is a Friday
      const friday = new Date("2025-01-03");
      const formattedFriday = format(friday, "yyyy-MM-dd");

      const mockEmployees = [
        {
          id: "emp1",
          name: "Jane Smith",
          payrollId: "P002",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { name: "Developer", id: "role1" },
          assignments: [
            {
              team: { id: "team1", name: "Team A" },
            },
          ],
        },
      ];

      const mockTimeTypes = [
        {
          id: "tt1",
          name: "Friday Update",
          isCapDev: false,
          weeklySchedule: '{ "days": ["friday"] }',
        },
        {
          id: "tt2",
          name: "Regular Work",
          isCapDev: false,
        },
      ];

      const mockGeneralTimeAssignments = [
        {
          id: "gta1",
          roleId: "role1",
          timeTypeId: "tt1",
          hoursPerWeek: 1,
          timeType: {
            id: "tt1",
            name: "Friday Update",
            isCapDev: false,
          },
        },
      ];

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        { id: "team1", name: "Team A" },
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        { id: "role1", name: "Developer" },
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with the date range January 1-3, 2025 (includes only one Friday)
      const result = await getTimeReportData({
        from: new Date("2025-01-01"), // Wednesday
        to: new Date("2025-01-03"), // Friday
      });

      // Assertions
      expect(result.timeReports).toHaveLength(1);

      // Check all time entries
      const allEntries = result.timeReports[0].timeEntries;

      // Should have only one entry (for January 3rd)
      expect(allEntries).toHaveLength(1);

      // Verify the Friday Update entry
      const fridayEntry = allEntries[0];
      expect(fridayEntry.date).toBe(formattedFriday);
      expect(fridayEntry.isScheduled).toBe(true);
      expect(fridayEntry.timeTypeId).toBe("tt1");
      expect(fridayEntry.scheduledTimeTypeName).toBe("Friday Update");
      expect(fridayEntry.hours).toBe(1);

      // Also check that activityDate is set to the Friday
      expect(fridayEntry.activityDate).toBe(formattedFriday);

      // Check total hours - should be 1 hour (just one Friday)
      expect(result.timeReports[0].fullHours).toBe(1);
    });

    it("should prioritize scheduled time types over other entries on the same day", async () => {
      // January 13, 2023 was a Friday
      const testDate = new Date("2023-01-13");
      const formattedTestDate = format(testDate, "yyyy-MM-dd");

      const mockEmployees = [
        {
          id: "emp1",
          name: "John Doe",
          payrollId: "P001",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { name: "Developer", id: "role1" },
          assignments: [
            {
              team: { id: "team1", name: "Team A" },
            },
          ],
        },
      ];

      const mockTimeTypes = [
        {
          id: "tt1",
          name: "Friday Training",
          isCapDev: true,
          weeklySchedule: '{ "days": ["friday"] }',
        },
        {
          id: "tt2",
          name: "Regular Work",
          isCapDev: false,
        },
      ];

      const mockGeneralTimeAssignments = [
        {
          id: "gta1",
          roleId: "role1",
          timeTypeId: "tt1",
          hoursPerWeek: 8,
          timeType: {
            id: "tt1",
            name: "Friday Training",
            isCapDev: true,
          },
        },
      ];

      // Create a project activity on the same day as the scheduled time type
      const mockProjectActivities = [
        {
          id: "activity1",
          activityDate: testDate, // Same date as the scheduled time type
          jiraIssueId: "JIRA-123",
          project: {
            id: "proj1",
            name: "Project X",
            isCapDev: false,
            board: {
              teamId: "team1",
            },
          },
        },
      ];

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        { id: "team1", name: "Team A" },
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue(
        mockProjectActivities
      );

      // Call the function with a date range that includes the Friday
      const result = await getTimeReportData({
        from: new Date("2023-01-13"), // Friday
        to: new Date("2023-01-13"), // Friday
      });

      // Assertions
      expect(result.timeReports).toHaveLength(1);

      // Should have both entries
      expect(result.timeReports[0].timeEntries).toHaveLength(2);

      // The first entry should be the scheduled one (prioritized)
      const firstEntry = result.timeReports[0].timeEntries[0];
      expect(firstEntry.isScheduled).toBe(true);
      expect(firstEntry.timeTypeId).toBe("tt1");
      expect(firstEntry.hours).toBe(8); // Hours from general time assignment

      // The second entry should be the project activity
      const secondEntry = result.timeReports[0].timeEntries[1];
      expect(secondEntry.projectId).toBe("proj1");

      // Check total hours
      expect(result.timeReports[0].fullHours).toBe(16); // 8 hours scheduled + 8 hours project
    });

    it("should filter employees by search term", async () => {
      // Setup mocks with empty results
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        []
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with search parameter
      await getTimeReportData({
        from: new Date(),
        to: new Date(),
        search: "John",
      });

      // Verify the search parameter was used correctly
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

    it("should filter employees by role", async () => {
      // Setup mocks with empty results
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        []
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with role parameter
      await getTimeReportData({
        from: new Date(),
        to: new Date(),
        role: "role1",
      });

      // Verify the role parameter was used correctly
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([{ roleId: "role1" }]),
          }),
        })
      );
    });

    it("should filter employees by team", async () => {
      // Setup mocks with empty results
      (prisma.employee.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        []
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      const from = new Date("2023-01-01");
      const to = new Date("2023-12-31");

      // Call the function with team parameter
      await getTimeReportData({
        team: "team1",
        from,
        to,
      });

      // Verify the team parameter was used correctly
      expect(prisma.employee.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                assignments: {
                  some: {
                    teamId: "team1",
                    startDate: { lte: to },
                    OR: [{ endDate: null }, { endDate: { gte: from } }],
                  },
                },
              },
            ]),
          }),
        })
      );
    });

    it("should handle employees with no assignments", async () => {
      // Mock data with employee having no assignments
      const mockEmployees = [
        {
          id: "emp1",
          name: "John Doe",
          payrollId: "P001",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { name: "Developer", id: "role1" },
          assignments: [], // No assignments
        },
      ];

      // Setup mocks
      (prisma.employee.findMany as jest.Mock).mockResolvedValue(mockEmployees);
      (prisma.team.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        []
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.projectActivity.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function
      const result = await getTimeReportData({
        from: new Date(),
        to: new Date(),
      });

      // Assertions
      expect(result.timeReports).toHaveLength(1);
      expect(result.timeReports[0].team).toBe("Unassigned");
      expect(result.timeReports[0].timeEntries).toHaveLength(0);
    });
  });
});
