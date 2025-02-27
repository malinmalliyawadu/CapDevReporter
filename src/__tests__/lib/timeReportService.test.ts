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

// Mock date-holidays
jest.mock("date-holidays", () => {
  return jest.fn().mockImplementation(() => {
    return {
      isHoliday: (date: Date) => {
        const dateStr = format(date, "yyyy-MM-dd");
        const holidays: Record<string, Array<{ name: string }>> = {
          "2022-12-26": [{ name: "Boxing Day" }],
          "2022-12-27": [{ name: "Christmas Day (substitute day)" }],
          "2023-01-02": [{ name: "Day after New Year's Day" }],
          "2023-01-03": [{ name: "New Year's Day (substitute day)" }],
          "2023-01-23": [{ name: "Provincial anniversary day" }],
          "2023-02-06": [{ name: "Waitangi Day" }],
          "2025-01-01": [{ name: "New Year's Day" }],
          "2025-01-02": [{ name: "Day after New Year's Day" }],
        };
        return holidays[dateStr] || false;
      },
    };
  });
});

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
              startDate: new Date("2023-01-01"),
              endDate: null,
              team: {
                id: "team1",
                name: "Team A",
                jiraBoards: [],
              },
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
          status: "APPROVED",
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

      // Call the function with default dates
      const result = await getTimeReportData({
        from: new Date("2023-01-01"),
        to: new Date("2023-01-31"),
      });

      // Assertions for the structure
      expect(result.timeReports.length).toBeGreaterThan(0);

      // Find any report for the employee
      const employeeReport = result.timeReports.find(
        (report) => report.employeeId === "emp1"
      );
      expect(employeeReport).toBeDefined();
      expect(employeeReport?.employeeName).toBe("John Doe");
      expect(employeeReport?.payrollId).toBe("P001");
      expect(employeeReport?.team).toBe("Team A");
      expect(employeeReport?.role).toBe("Developer");

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
              startDate: new Date("2023-01-01"),
              endDate: null,
              team: {
                id: "team1",
                name: "Team A",
                jiraBoards: [],
              },
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

      // Call the function with a date range that includes the Friday
      const result = await getTimeReportData({
        from: new Date("2023-01-09"), // Monday
        to: new Date("2023-01-15"), // Sunday
      });

      // Find the week that contains January 13
      const weekWithFriday = result.timeReports.find(
        (report) => report.week === format(new Date("2023-01-09"), "yyyy-MM-dd")
      );

      expect(weekWithFriday).toBeDefined();

      // Check for the scheduled entry
      const scheduledEntries = weekWithFriday?.timeEntries.filter(
        (entry) => entry.isScheduled
      );

      expect(scheduledEntries?.length).toBe(1);
      expect(scheduledEntries?.[0].timeTypeId).toBe("tt1");
      expect(scheduledEntries?.[0].date).toBe(formattedTestDate);
      expect(scheduledEntries?.[0].scheduledTimeTypeName).toBe(
        "Friday Training"
      );
      expect(scheduledEntries?.[0].isCapDev).toBe(true);
      expect(scheduledEntries?.[0].hours).toBe(8); // Hours from general time assignment
    });

    it("should apply 1-hour Friday Update for January 1-15, 2025", async () => {
      // January 3 and January 10, 2025 are Fridays
      const firstFriday = new Date("2025-01-03");
      const secondFriday = new Date("2025-01-10");
      const thirdFriday = new Date("2025-01-17");
      const formattedFirstFriday = format(firstFriday, "yyyy-MM-dd");
      const formattedSecondFriday = format(secondFriday, "yyyy-MM-dd");
      const formattedThirdFriday = format(thirdFriday, "yyyy-MM-dd");

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
              startDate: new Date("2025-01-01"),
              endDate: null,
              team: {
                id: "team1",
                name: "Team A",
                jiraBoards: [],
              },
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

      // Call the function with the date range January 1-15, 2025 (includes two Fridays)
      const result = await getTimeReportData({
        from: new Date("2025-01-01"), // Wednesday
        to: new Date("2025-01-17"), // Friday (two weeks later)
      });

      // We should have three weeks of data
      const weeks = result.timeReports.filter(
        (report) => report.employeeId === "emp1"
      );
      expect(weeks.length).toBe(3);

      // Find the weeks containing each Friday
      const firstWeek = weeks.find((report) =>
        report.timeEntries.some((entry) => entry.date === formattedFirstFriday)
      );
      const secondWeek = weeks.find((report) =>
        report.timeEntries.some((entry) => entry.date === formattedSecondFriday)
      );
      const thirdWeek = weeks.find((report) =>
        report.timeEntries.some((entry) => entry.date === formattedThirdFriday)
      );

      expect(firstWeek).toBeDefined();
      expect(secondWeek).toBeDefined();
      expect(thirdWeek).toBeDefined();

      // Verify the first Friday Update entry
      const firstFridayEntry = firstWeek?.timeEntries.find(
        (entry) => entry.date === formattedFirstFriday
      );
      expect(firstFridayEntry).toBeDefined();
      expect(firstFridayEntry?.isScheduled).toBe(true);
      expect(firstFridayEntry?.timeTypeId).toBe("tt1");
      expect(firstFridayEntry?.scheduledTimeTypeName).toBe("Friday Update");
      expect(firstFridayEntry?.hours).toBe(1);

      // Explicitly verify that activityDate is set to the Friday and matches the date field
      expect(firstFridayEntry?.activityDate).toBe(formattedFirstFriday);
      expect(firstFridayEntry?.activityDate).toBe(firstFridayEntry?.date);
      expect(firstFridayEntry?.activityDate).toBe("2025-01-03");

      // Verify the second Friday Update entry
      const secondFridayEntry = secondWeek?.timeEntries.find(
        (entry) => entry.date === formattedSecondFriday
      );
      expect(secondFridayEntry).toBeDefined();
      expect(secondFridayEntry?.isScheduled).toBe(true);
      expect(secondFridayEntry?.timeTypeId).toBe("tt1");
      expect(secondFridayEntry?.scheduledTimeTypeName).toBe("Friday Update");
      expect(secondFridayEntry?.hours).toBe(1);

      // Explicitly verify that activityDate is set to the Friday and matches the date field
      expect(secondFridayEntry?.activityDate).toBe(formattedSecondFriday);
      expect(secondFridayEntry?.activityDate).toBe(secondFridayEntry?.date);
      expect(secondFridayEntry?.activityDate).toBe("2025-01-10");

      // Verify the third Friday Update entry
      const thirdFridayEntry = thirdWeek?.timeEntries.find(
        (entry) => entry.date === formattedThirdFriday
      );
      expect(thirdFridayEntry).toBeDefined();
      expect(thirdFridayEntry?.isScheduled).toBe(true);
      expect(thirdFridayEntry?.timeTypeId).toBe("tt1");
      expect(thirdFridayEntry?.scheduledTimeTypeName).toBe("Friday Update");
      expect(thirdFridayEntry?.hours).toBe(1);
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
              startDate: new Date("2025-01-01"),
              endDate: null,
              team: {
                id: "team1",
                name: "Team A",
                jiraBoards: [],
              },
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

      // Call the function with the date range January 1-3, 2025 (includes only one Friday)
      const result = await getTimeReportData({
        from: new Date("2025-01-01"), // Wednesday
        to: new Date("2025-01-03"), // Friday
      });

      // Find the week containing January 3
      const week = result.timeReports.find((report) =>
        report.timeEntries.some((entry) => entry.date === formattedFriday)
      );

      expect(week).toBeDefined();

      // Get all entries for January 3
      const allEntries = week?.timeEntries.filter(
        (entry) => entry.date === formattedFriday
      );

      // Should have one entry for January 3rd
      expect(allEntries?.length).toBe(1);

      // Verify the Friday Update entry
      const fridayEntry = allEntries?.[0];
      expect(fridayEntry?.date).toBe(formattedFriday);
      expect(fridayEntry?.isScheduled).toBe(true);
      expect(fridayEntry?.timeTypeId).toBe("tt1");
      expect(fridayEntry?.scheduledTimeTypeName).toBe("Friday Update");
      expect(fridayEntry?.hours).toBe(1);

      // Explicitly verify that activityDate is set to the Friday and matches the date field
      expect(fridayEntry?.activityDate).toBe(formattedFriday);
      expect(fridayEntry?.activityDate).toBe(fridayEntry?.date);
      expect(fridayEntry?.activityDate).toBe("2025-01-03");
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
              startDate: new Date("2023-01-01"),
              endDate: null,
              team: {
                id: "team1",
                name: "Team A",
                jiraBoards: [
                  {
                    id: "board1",
                    projects: [
                      {
                        id: "proj1",
                        name: "Project X",
                        isCapDev: false,
                        activities: [
                          {
                            id: "activity1",
                            activityDate: testDate,
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
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
      (prisma.team.findMany as jest.Mock).mockResolvedValue([
        { id: "team1", name: "Team A" },
      ]);
      (prisma.role.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with a date range that includes the Friday
      const result = await getTimeReportData({
        from: new Date("2023-01-13"), // Friday
        to: new Date("2023-01-13"), // Friday
      });

      // Find the week containing January 13
      const week = result.timeReports.find((report) =>
        report.timeEntries.some((entry) => entry.date === formattedTestDate)
      );

      expect(week).toBeDefined();

      // Get all entries for January 13
      const entries = week?.timeEntries.filter(
        (entry) => entry.date === formattedTestDate
      );

      // Should have two entries
      expect(entries?.length).toBe(2);

      // The first entry should be the scheduled one (prioritized)
      const scheduledEntry = entries?.find((entry) => entry.isScheduled);
      expect(scheduledEntry).toBeDefined();
      expect(scheduledEntry?.timeTypeId).toBe("tt1");
      expect(scheduledEntry?.hours).toBe(8);

      // The second entry should be the project activity
      const projectEntry = entries?.find((entry) => entry.projectId);
      expect(projectEntry).toBeDefined();
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

      // Call the function
      const result = await getTimeReportData({
        from: new Date("2023-01-01"),
        to: new Date("2023-01-07"),
      });

      // Assertions
      expect(result.timeReports.length).toBeGreaterThan(0);

      // Find a report for the employee
      const employeeReport = result.timeReports.find(
        (report) => report.employeeId === "emp1"
      );
      expect(employeeReport).toBeDefined();
      expect(employeeReport?.team).toBe("Unassigned");
    });
  });
});
