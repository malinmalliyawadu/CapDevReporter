import { TimeReport } from "@/types/timeReport";

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

// Sample users data
const users = [
  {
    name: "John Doe",
    payrollId: "EMP001",
    team: "Engineering",
    role: "Software Engineer",
  },
  {
    name: "Jane Smith",
    payrollId: "EMP002",
    team: "Design",
    role: "UX Designer",
  },
  {
    name: "Mike Johnson",
    payrollId: "EMP003",
    team: "Engineering",
    role: "Software Engineer",
  },
  {
    name: "Sarah Williams",
    payrollId: "EMP004",
    team: "Product",
    role: "Product Manager",
  },
  {
    name: "Alex Brown",
    payrollId: "EMP005",
    team: "Engineering",
    role: "DevOps Engineer",
  },
  {
    name: "Emily Davis",
    payrollId: "EMP006",
    team: "Design",
    role: "UI Designer",
  },
  {
    name: "Chris Wilson",
    payrollId: "EMP007",
    team: "Engineering",
    role: "Software Engineer",
  },
  {
    name: "Lisa Anderson",
    payrollId: "EMP008",
    team: "Product",
    role: "Product Manager",
  },
];

// Generate data
export const timeReports: TimeReport[] = [];
const weeks = generateWeeks();

weeks.forEach((week) => {
  users.forEach((user) => {
    // Generate more realistic data patterns
    const isEngineer = user.role.includes("Engineer");
    const isDesigner = user.role.includes("Designer");

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
      id: `${user.payrollId}-${week}`,
      user: user.name,
      week,
      payrollId: user.payrollId,
      fullHours,
      capdevTime,
      nonCapdevTime,
      team: user.team,
      role: user.role,
    });
  });
});
