import { TimeReport, TimeEntry } from "@/types/timeReport";
import { employees } from "./employees";
import { teams } from "./teams";
import { roles } from "./roles";
import { generalTimeAssignments } from "./generalTimeAssignments";
import { timeTypes } from "./timeTypes";

// Helper function to generate a random number between min and max
const random = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to generate weeks for the past 24 months
const generateWeeks = () => {
  const weeks = [];
  const now = new Date();

  for (let i = 0; i < 24 * 4.33; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const monday = new Date(date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    weeks.push(monday.toISOString().split("T")[0]);
  }

  return weeks.sort().reverse();
};

// Generate time entries based on general time assignments
const generateTimeEntries = (
  roleId: number,
  totalHours: number
): TimeEntry[] => {
  const entries: TimeEntry[] = [];
  const assignments = generalTimeAssignments.filter((a) => a.roleId === roleId);

  if (!assignments.length) {
    // Default entry if no assignments
    return [
      {
        timeTypeId: 2, // Project Work
        hours: totalHours,
        isCapDev: true,
      },
    ];
  }

  // Calculate total assigned hours
  const totalAssignedHours = assignments.reduce(
    (sum, a) => sum + a.hoursPerWeek,
    0
  );

  // Generate entries for each assignment
  assignments.forEach((assignment) => {
    const timeType = timeTypes.find((t) => t.id === assignment.timeTypeId);
    if (timeType) {
      // Scale the hours proportionally if total assigned hours differs from actual hours
      const scaledHours = Math.round(
        (assignment.hoursPerWeek / totalAssignedHours) * totalHours
      );
      entries.push({
        timeTypeId: timeType.id,
        hours: scaledHours,
        isCapDev: timeType.isCapDev,
      });
    }
  });

  // Adjust for rounding errors to match total hours
  const currentTotal = entries.reduce((sum, entry) => sum + entry.hours, 0);
  if (currentTotal !== totalHours) {
    const diff = totalHours - currentTotal;
    entries[0].hours += diff; // Add any difference to the first entry
  }

  return entries;
};

// Generate data
export const timeReports: TimeReport[] = [];
const weeks = generateWeeks();

weeks.forEach((week) => {
  employees.forEach((employee) => {
    const fullHours = random(36, 40); // Most people work 36-40 hours
    const timeEntries = generateTimeEntries(employee.roleId, fullHours);

    timeReports.push({
      id: `${employee.payrollId}-${week}`,
      user: employee.name,
      week,
      payrollId: employee.payrollId,
      fullHours,
      timeEntries,
      team: teams.find((t) => t.id === employee.teamId)?.name || "Unknown",
      role: roles.find((r) => r.id === employee.roleId)?.name || "Unknown",
    });
  });
});
