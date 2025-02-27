import { getTimeReportData } from "@/lib/timeReportService";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import Holidays from "date-holidays";

// Mock the Prisma client
jest.mock("@/lib/prisma", () => ({
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

    it("should correctly add multiple scheduled time types", async () => {
      // Test week: January 9-15, 2023
      // Monday: Jan 9, Tuesday: Jan 10, Wednesday: Jan 11, Thursday: Jan 12, Friday: Jan 13
      const monday = new Date("2023-01-09");
      const tuesday = new Date("2023-01-10");
      const wednesday = new Date("2023-01-11");
      const thursday = new Date("2023-01-12");
      const friday = new Date("2023-01-13");

      const formattedMonday = format(monday, "yyyy-MM-dd");
      const formattedTuesday = format(tuesday, "yyyy-MM-dd");
      const formattedWednesday = format(wednesday, "yyyy-MM-dd");
      const formattedThursday = format(thursday, "yyyy-MM-dd");
      const formattedFriday = format(friday, "yyyy-MM-dd");

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
          name: "Monday Standup",
          isCapDev: false,
          weeklySchedule: '{ "days": ["monday"] }',
        },
        {
          id: "tt2",
          name: "Tuesday Planning",
          isCapDev: false,
          weeklySchedule: '{ "days": ["tuesday"] }',
        },
        {
          id: "tt3",
          name: "Wednesday Review",
          isCapDev: true,
          weeklySchedule: '{ "days": ["wednesday"] }',
        },
        {
          id: "tt4",
          name: "Thursday Demo",
          isCapDev: true,
          weeklySchedule: '{ "days": ["thursday"] }',
        },
        {
          id: "tt5",
          name: "Friday Training",
          isCapDev: true,
          weeklySchedule: '{ "days": ["friday"] }',
        },
        {
          id: "tt6",
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
            name: "Monday Standup",
            isCapDev: false,
          },
        },
        {
          id: "gta2",
          roleId: "role1",
          timeTypeId: "tt2",
          hoursPerWeek: 2,
          timeType: {
            id: "tt2",
            name: "Tuesday Planning",
            isCapDev: false,
          },
        },
        {
          id: "gta3",
          roleId: "role1",
          timeTypeId: "tt3",
          hoursPerWeek: 3,
          timeType: {
            id: "tt3",
            name: "Wednesday Review",
            isCapDev: true,
          },
        },
        {
          id: "gta4",
          roleId: "role1",
          timeTypeId: "tt4",
          hoursPerWeek: 4,
          timeType: {
            id: "tt4",
            name: "Thursday Demo",
            isCapDev: true,
          },
        },
        {
          id: "gta5",
          roleId: "role1",
          timeTypeId: "tt5",
          hoursPerWeek: 5,
          timeType: {
            id: "tt5",
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
      (prisma.role.findMany as jest.Mock).mockResolvedValue([
        { id: "role1", name: "Developer" },
      ]);
      (prisma.timeType.findMany as jest.Mock).mockResolvedValue(mockTimeTypes);
      (prisma.generalTimeAssignment.findMany as jest.Mock).mockResolvedValue(
        mockGeneralTimeAssignments
      );
      (prisma.leave.findMany as jest.Mock).mockResolvedValue([]);

      // Call the function with the date range January 9-15, 2023
      const result = await getTimeReportData({
        from: new Date("2023-01-09"), // Monday
        to: new Date("2023-01-15"), // Sunday
      });

      // Find the week that contains our test dates
      const week = result.timeReports.find(
        (report) => report.week === format(new Date("2023-01-09"), "yyyy-MM-dd")
      );

      expect(week).toBeDefined();

      // Check for Monday Standup
      const mondayEntry = week?.timeEntries.find(
        (entry) => entry.date === formattedMonday && entry.isScheduled
      );
      expect(mondayEntry).toBeDefined();
      expect(mondayEntry?.timeTypeId).toBe("tt1");
      expect(mondayEntry?.scheduledTimeTypeName).toBe("Monday Standup");
      expect(mondayEntry?.hours).toBe(1);
      expect(mondayEntry?.isCapDev).toBe(false);

      // Check for Tuesday Planning
      const tuesdayEntry = week?.timeEntries.find(
        (entry) => entry.date === formattedTuesday && entry.isScheduled
      );
      expect(tuesdayEntry).toBeDefined();
      expect(tuesdayEntry?.timeTypeId).toBe("tt2");
      expect(tuesdayEntry?.scheduledTimeTypeName).toBe("Tuesday Planning");
      expect(tuesdayEntry?.hours).toBe(2);
      expect(tuesdayEntry?.isCapDev).toBe(false);

      // Check for Wednesday Review
      const wednesdayEntry = week?.timeEntries.find(
        (entry) => entry.date === formattedWednesday && entry.isScheduled
      );
      expect(wednesdayEntry).toBeDefined();
      expect(wednesdayEntry?.timeTypeId).toBe("tt3");
      expect(wednesdayEntry?.scheduledTimeTypeName).toBe("Wednesday Review");
      expect(wednesdayEntry?.hours).toBe(3);
      expect(wednesdayEntry?.isCapDev).toBe(true);

      // Check for Thursday Demo
      const thursdayEntry = week?.timeEntries.find(
        (entry) => entry.date === formattedThursday && entry.isScheduled
      );
      expect(thursdayEntry).toBeDefined();
      expect(thursdayEntry?.timeTypeId).toBe("tt4");
      expect(thursdayEntry?.scheduledTimeTypeName).toBe("Thursday Demo");
      expect(thursdayEntry?.hours).toBe(4);
      expect(thursdayEntry?.isCapDev).toBe(true);

      // Check for Friday Training
      const fridayEntry = week?.timeEntries.find(
        (entry) => entry.date === formattedFriday && entry.isScheduled
      );
      expect(fridayEntry).toBeDefined();
      expect(fridayEntry?.timeTypeId).toBe("tt5");
      expect(fridayEntry?.scheduledTimeTypeName).toBe("Friday Training");
      expect(fridayEntry?.hours).toBe(5);
      expect(fridayEntry?.isCapDev).toBe(true);

      // Verify all scheduled entries are present
      const scheduledEntries = week?.timeEntries.filter(
        (entry) => entry.isScheduled
      );
      expect(scheduledEntries?.length).toBe(5);
    });

    it("should distribute regular time types (without weekly schedule) evenly throughout the work week", () => {
      // Mock data
      const mockEmployees = [
        {
          id: "emp1",
          name: "John Doe",
          payrollId: "P123",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { id: "role1", name: "Developer" },
          createdAt: new Date(),
          updatedAt: new Date(),
          assignments: [
            {
              teamId: "team1",
              team: {
                id: "team1",
                name: "Team A",
                jiraBoards: [],
              },
              startDate: new Date("2023-01-01"),
              endDate: null,
            },
          ],
        },
      ];

      const mockTimeTypes = [
        {
          id: "tt1",
          name: "Regular Work",
          isCapDev: false,
          weeklySchedule: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "tt2",
          name: "Development",
          isCapDev: true,
          weeklySchedule: null,
          description: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockGeneralAssignments = [
        {
          id: "ga1",
          roleId: "role1",
          timeTypeId: "tt1",
          hoursPerWeek: 20,
          createdAt: new Date(),
          updatedAt: new Date(),
          timeType: {
            id: "tt1",
            name: "Regular Work",
            isCapDev: false,
          },
        },
        {
          id: "ga2",
          roleId: "role1",
          timeTypeId: "tt2",
          hoursPerWeek: 15,
          createdAt: new Date(),
          updatedAt: new Date(),
          timeType: {
            id: "tt2",
            name: "Development",
            isCapDev: true,
          },
        },
      ];

      // Mock the prisma client
      jest.spyOn(prisma.employee, "findMany").mockResolvedValue(mockEmployees);
      jest.spyOn(prisma.leave, "findMany").mockResolvedValue([]);
      jest
        .spyOn(prisma.generalTimeAssignment, "findMany")
        .mockResolvedValue(mockGeneralAssignments);
      jest.spyOn(prisma.timeType, "findMany").mockResolvedValue(mockTimeTypes);
      jest.spyOn(prisma.team, "findMany").mockResolvedValue([]);
      jest.spyOn(prisma.role, "findMany").mockResolvedValue([]);

      // Define the date range for the test (January 16-20, 2023 - a regular work week)
      const from = new Date("2023-01-16");
      const to = new Date("2023-01-20");

      // Call the function
      return getTimeReportData({ from, to }).then((result) => {
        // Get the time report for the employee
        const timeReport = result.timeReports[0];
        expect(timeReport).toBeDefined();

        // Get the week
        const week = timeReport;
        expect(week).toBeDefined();

        // Check that we have the correct number of entries
        // We should have 2 entries (one for each regular time type)
        expect(week?.timeEntries.length).toBe(2);

        // Check that each entry is a rolled-up entry
        week?.timeEntries.forEach((entry) => {
          expect(entry.isRolledUp).toBe(true);
        });

        // Check the Regular Work entry
        const regularWorkEntry = week?.timeEntries.find(
          (entry) => entry.timeTypeId === "tt1"
        );
        expect(regularWorkEntry).toBeDefined();
        expect(regularWorkEntry?.hours).toBe(20); // Total hours for the week
        expect(regularWorkEntry?.isCapDev).toBe(false);
        expect(regularWorkEntry?.scheduledTimeTypeName).toBe("Regular Work");
        expect(regularWorkEntry?.rolledUpHoursPerWeek).toBe(20);

        // Check the Development entry
        const developmentEntry = week?.timeEntries.find(
          (entry) => entry.timeTypeId === "tt2"
        );
        expect(developmentEntry).toBeDefined();
        expect(developmentEntry?.hours).toBe(15); // Total hours for the week
        expect(developmentEntry?.isCapDev).toBe(true);
        expect(developmentEntry?.scheduledTimeTypeName).toBe("Development");
        expect(developmentEntry?.rolledUpHoursPerWeek).toBe(15);

        // Verify total hours for the employee
        expect(week?.fullHours).toBe(35); // 20 + 15 = 35 hours total
      });
    });

    it("should distribute project hours based on remaining time in the week", async () => {
      // Test week: January 16-20, 2023 (Monday to Friday)
      const monday = new Date("2023-01-16");
      const tuesday = new Date("2023-01-17");
      const wednesday = new Date("2023-01-18");

      const mockEmployees = [
        {
          id: "emp1",
          name: "John Doe",
          payrollId: "P001",
          hoursPerWeek: 40, // 40 hour work week
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
                        jiraId: "PROJ-1",
                        activities: [
                          {
                            id: "activity1",
                            activityDate: monday,
                            jiraIssueId: "PROJ-1",
                          },
                          {
                            id: "activity2",
                            activityDate: tuesday,
                            jiraIssueId: "PROJ-1",
                          },
                        ],
                      },
                      {
                        id: "proj2",
                        name: "Project Y",
                        isCapDev: true,
                        jiraId: "PROJ-2",
                        activities: [
                          {
                            id: "activity3",
                            activityDate: wednesday,
                            jiraIssueId: "PROJ-2",
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
          hoursPerWeek: 1, // 1 hour Friday update
          timeType: {
            id: "tt1",
            name: "Friday Update",
            isCapDev: false,
          },
        },
        {
          id: "gta2",
          roleId: "role1",
          timeTypeId: "tt2",
          hoursPerWeek: 15, // 15 hours of regular work
          timeType: {
            id: "tt2",
            name: "Regular Work",
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

      // Call the function with the date range January 16-20, 2023
      const result = await getTimeReportData({
        from: new Date("2023-01-16"), // Monday
        to: new Date("2023-01-20"), // Friday
      });

      // Find the week that contains our test dates
      const week = result.timeReports[0];
      expect(week).toBeDefined();

      // Calculate expected distribution
      // Total week hours: 40
      // - Friday Update: 1 hour
      // - Regular Work: 15 hours
      // Remaining: 24 hours to distribute among 3 project activities
      // Expected hours per activity: 8 hours

      // Verify project activities
      const projectEntries = week.timeEntries.filter(
        (entry) => entry.projectId
      );
      expect(projectEntries.length).toBe(3); // Should have 3 project activities

      // Each project activity should have 8 hours (24 hours / 3 activities)
      projectEntries.forEach((entry) => {
        expect(entry.hours).toBeCloseTo(8, 1);
      });

      // Verify total hours adds up to employee's hours per week
      expect(week.fullHours).toBeCloseTo(40, 1); // 1 (Friday) + 15 (Regular) + 24 (Projects) = 40

      // Verify Project X entries (2 activities)
      const projectXEntries = projectEntries.filter(
        (entry) => entry.projectName === "Project X"
      );
      expect(projectXEntries.length).toBe(2);
      projectXEntries.forEach((entry) => {
        expect(entry.isCapDev).toBe(false);
        expect(entry.hours).toBeCloseTo(8, 1);
      });

      // Verify Project Y entry (1 activity)
      const projectYEntry = projectEntries.find(
        (entry) => entry.projectName === "Project Y"
      );
      expect(projectYEntry).toBeDefined();
      expect(projectYEntry?.isCapDev).toBe(true);
      expect(projectYEntry?.hours).toBeCloseTo(8, 1);
    });

    it("should correctly filter and deduplicate project activities within the week", async () => {
      // Mock data setup
      const mockEmployees = [
        {
          id: "emp1",
          name: "Test Employee",
          payrollId: "E001",
          hoursPerWeek: 40,
          roleId: "role1",
          role: { id: "role1", name: "Developer" },
          assignments: [
            {
              id: "assignment1",
              startDate: new Date("2023-01-01"),
              endDate: null,
              teamId: "team1",
              team: {
                id: "team1",
                name: "Test Team",
                jiraBoards: [
                  {
                    id: "board1",
                    projects: [
                      {
                        id: "project1",
                        name: "Test Project",
                        isCapDev: false,
                        activities: [
                          // Activities within the week (Monday-Friday)
                          {
                            activityDate: new Date("2023-01-16"),
                            jiraIssueId: "PROJ-1",
                          }, // Monday
                          {
                            activityDate: new Date("2023-01-16"),
                            jiraIssueId: "PROJ-1",
                          }, // Monday (duplicate)
                          {
                            activityDate: new Date("2023-01-17"),
                            jiraIssueId: "PROJ-1",
                          }, // Tuesday
                          // Activities outside the week
                          {
                            activityDate: new Date("2023-01-23"),
                            jiraIssueId: "PROJ-1",
                          }, // Next Monday
                          {
                            activityDate: new Date("2023-01-09"),
                            jiraIssueId: "PROJ-1",
                          }, // Previous Monday
                          // Weekend activities (should be excluded)
                          {
                            activityDate: new Date("2023-01-21"),
                            jiraIssueId: "PROJ-1",
                          }, // Saturday
                          {
                            activityDate: new Date("2023-01-22"),
                            jiraIssueId: "PROJ-1",
                          }, // Sunday
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
          name: "Project Work",
          isCapDev: false,
        },
      ];

      // Mock database calls
      prisma.employee.findMany.mockResolvedValue(mockEmployees);
      prisma.timeType.findMany.mockResolvedValue(mockTimeTypes);
      prisma.leave.findMany.mockResolvedValue([]);
      prisma.generalTimeAssignment.findMany.mockResolvedValue([]);
      prisma.team.findMany.mockResolvedValue([]);
      prisma.role.findMany.mockResolvedValue([]);

      // Get time report data for the week of January 16-20, 2023
      const result = await getTimeReportData({
        from: new Date("2023-01-16"),
        to: new Date("2023-01-20"),
      });

      const report = result.timeReports[0];
      const projectEntries = report.timeEntries.filter(
        (entry) => entry.projectId === "project1"
      );

      // Verify that only activities within the week are included
      expect(projectEntries.length).toBe(2); // Only Monday and Tuesday entries should be included

      // Verify that duplicate activities on the same day are deduplicated
      const mondayEntries = projectEntries.filter(
        (entry) => entry.date === "2023-01-16"
      );
      expect(mondayEntries.length).toBe(1); // Should only have one entry for Monday

      // Verify that weekend activities are excluded
      const weekendEntries = projectEntries.filter(
        (entry) => entry.date === "2023-01-21" || entry.date === "2023-01-22"
      );
      expect(weekendEntries.length).toBe(0);

      // Verify that activities outside the week range are excluded
      const outsideWeekEntries = projectEntries.filter(
        (entry) => entry.date === "2023-01-09" || entry.date === "2023-01-23"
      );
      expect(outsideWeekEntries.length).toBe(0);

      // Verify that remaining hours are distributed evenly
      const expectedHoursPerActivity =
        (40 -
          report.fullHours +
          projectEntries.reduce((sum, entry) => sum + entry.hours, 0)) /
        2;
      projectEntries.forEach((entry) => {
        expect(entry.hours).toBe(expectedHoursPerActivity);
      });

      // Verify that project entries have correct structure
      projectEntries.forEach((entry) => {
        expect(entry).toMatchObject({
          projectId: "project1",
          projectName: "Test Project",
          teamName: "Test Team",
          jiraId: "PROJ-1",
          jiraUrl: "https://jira.example.com/browse/PROJ-1",
          isCapDev: false,
        });
      });
    });
  });
});
