import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Seed roles
  const roles = [
    {
      name: "Software Engineer",
      description: "Develops software applications",
    },
    {
      name: "Project Manager",
      description: "Manages project timelines and resources",
    },
    {
      name: "Designer",
      description: "Creates user interfaces and experiences",
    },
    { name: "QA Engineer", description: "Tests and ensures software quality" },
    {
      name: "DevOps Engineer",
      description: "Manages infrastructure and deployment",
    },
    {
      name: "Product Manager",
      description: "Defines product vision and roadmap",
    },
  ];

  console.log("Seeding roles...");
  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  // Seed teams
  const teams = [
    { name: "Engineering", description: "Core engineering team" },
    { name: "Design", description: "UI/UX design team" },
    { name: "Product", description: "Product management team" },
    { name: "QA", description: "Quality assurance team" },
  ];

  console.log("Seeding teams...");
  for (const team of teams) {
    await prisma.team.upsert({
      where: { name: team.name },
      update: {},
      create: team,
    });
  }

  // Seed employees
  console.log("Seeding employees...");
  const employees = [
    {
      name: "John Smith",
      payrollId: "EMP001",
      hoursPerWeek: 40,
      team: { connect: { name: "Engineering" } },
      role: { connect: { name: "Software Engineer" } },
    },
    {
      name: "Sarah Johnson",
      payrollId: "EMP002",
      hoursPerWeek: 40,
      team: { connect: { name: "Design" } },
      role: { connect: { name: "Designer" } },
    },
    {
      name: "Michael Chen",
      payrollId: "EMP003",
      hoursPerWeek: 40,
      team: { connect: { name: "Engineering" } },
      role: { connect: { name: "DevOps Engineer" } },
    },
    {
      name: "Emily Davis",
      payrollId: "EMP004",
      hoursPerWeek: 32,
      team: { connect: { name: "Product" } },
      role: { connect: { name: "Product Manager" } },
    },
    {
      name: "James Wilson",
      payrollId: "EMP005",
      hoursPerWeek: 40,
      team: { connect: { name: "QA" } },
      role: { connect: { name: "QA Engineer" } },
    },
  ];

  // Create employees
  const createdEmployees = await Promise.all(
    employees.map((employee) =>
      prisma.employee.create({
        data: employee,
      })
    )
  );

  // Seed time types
  const timeTypes = [
    { name: "Regular", description: "Regular working hours" },
    { name: "Overtime", description: "Hours worked beyond regular schedule" },
    { name: "PTO", description: "Paid time off" },
    { name: "Sick Leave", description: "Time off due to illness" },
  ];

  console.log("Seeding time types...");
  for (const timeType of timeTypes) {
    await prisma.timeType.upsert({
      where: { name: timeType.name },
      update: {},
      create: timeType,
    });
  }

  // Get the Engineering team for reference
  const engineeringTeam = await prisma.team.findUnique({
    where: { name: "Engineering" },
  });

  if (!engineeringTeam) {
    throw new Error("Engineering team not found");
  }

  // Create a test user
  console.log("Creating test user...");
  await prisma.user.upsert({
    where: { email: "test@example.com" },
    update: {},
    create: {
      email: "test@example.com",
      name: "Test User",
      teams: {
        connect: { id: engineeringTeam.id },
      },
    },
  });

  // Create a test project
  console.log("Creating test project...");
  await prisma.project.upsert({
    where: { id: "test-project" },
    update: {},
    create: {
      id: "test-project",
      name: "Test Project",
      description: "A test project",
      teamId: engineeringTeam.id,
    },
  });

  // Create some leave records
  const leaveTypes = [
    "Annual Leave",
    "Sick Leave",
    "Bereavement Leave",
    "Other",
  ];
  const leaveStatuses = ["Approved", "Pending", "Taken"];

  for (const employee of createdEmployees) {
    // Create 3-5 leave records per employee
    const numLeaveRecords = Math.floor(Math.random() * 3) + 3;

    for (let i = 0; i < numLeaveRecords; i++) {
      const date = new Date();
      date.setDate(date.getDate() + Math.floor(Math.random() * 60) - 30); // Random date ±30 days from now

      await prisma.leave.create({
        data: {
          date,
          type: leaveTypes[Math.floor(Math.random() * leaveTypes.length)],
          status:
            leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)],
          duration: Math.random() < 0.2 ? 0.5 : 1, // 20% chance of half day
          employeeId: employee.id,
        },
      });
    }
  }

  console.log("Database has been seeded. 🌱");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
