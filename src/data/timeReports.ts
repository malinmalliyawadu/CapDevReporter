import { TimeReport } from "@/types/timeReport";
import { employees } from "./employees";
import { teams } from "./teams";
import { roles } from "./roles";

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


// Generate data
export const timeReports: TimeReport[] = [];
const weeks = generateWeeks();

weeks.forEach((week) => {
  employees.forEach((employee) => {
    // Generate more realistic data patterns
    const isEngineer = roles.find((r) => r.id === employee.roleId)?.name?.includes("Engineer");
    const isDesigner = roles.find((r) => r.id === employee.roleId)?.name?.includes("Designer");

    // Engineers tend to have more CapDev time
    const baseCapdevPercentage = isEngineer ? 0.8 : isDesigner ? 0.6 : 0.4;

    // Add some randomness
    const capdevVariation = random(-10, 10) / 100;
    const capdevRatio = Math.max(
      0.2,
      Math.min(0.9, baseCapdevPercentage + capdevVariation)
    );

    const fullHours = random(36, 40); // Most people work 36-40 hours
    const capdevTime = Math.round(fullHours * capdevRatio);
    const nonCapdevTime = fullHours - capdevTime;

    timeReports.push({
      id: `${employee.payrollId}-${week}`,
      user: employee.name,
      week,
      payrollId: employee.payrollId,
      fullHours,
      capdevTime,
      nonCapdevTime,
      team: teams.find((t) => t.id === employee.teamId)?.name || "Unknown",
      role: roles.find((r) => r.id === employee.roleId)?.name || "Unknown",
    });
  });
});
