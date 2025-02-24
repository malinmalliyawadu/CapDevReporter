import { PrismaClient } from "@prisma/client";
import { addDays, subDays, subWeeks } from "date-fns";

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const developerRole = await prisma.role.create({
    data: {
      name: "Software Developer",
      description: "Develops and maintains software applications",
    },
  });

  const seniorDevRole = await prisma.role.create({
    data: {
      name: "Senior Developer",
      description: "Leads development efforts and mentors other developers",
    },
  });

  const designerRole = await prisma.role.create({
    data: {
      name: "UI/UX Designer",
      description: "Designs user interfaces and experiences",
    },
  });

  const managerRole = await prisma.role.create({
    data: {
      name: "Project Manager",
      description: "Manages project timelines and resources",
    },
  });

  // Create teams
  const frontendTeam = await prisma.team.create({
    data: {
      name: "Frontend Team",
      description: "Responsible for user interface development",
    },
  });

  const backendTeam = await prisma.team.create({
    data: {
      name: "Backend Team",
      description: "Responsible for server-side development",
    },
  });

  const designTeam = await prisma.team.create({
    data: {
      name: "Design Team",
      description: "Responsible for UI/UX design",
    },
  });

  const platformTeam = await prisma.team.create({
    data: {
      name: "Platform Team",
      description: "Responsible for infrastructure and platform services",
    },
  });

  // Create Jira boards
  const [
    webBoard,
    mobileBoard,
    apiBoard,
    microservicesBoard,
    designBoard,
    researchBoard,
    maintenanceBoard,
    platformBoard,
  ] = await Promise.all([
    prisma.jiraBoard.create({
      data: {
        name: "Web Projects",
        boardId: "WEB",
        teamId: frontendTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "Mobile Projects",
        boardId: "MOB",
        teamId: frontendTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "API Projects",
        boardId: "API",
        teamId: backendTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "Microservices",
        boardId: "MICRO",
        teamId: backendTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "Design System",
        boardId: "DES",
        teamId: designTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "Research",
        boardId: "RES",
        teamId: designTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "Maintenance",
        boardId: "MAINT",
        teamId: backendTeam.id,
      },
    }),
    prisma.jiraBoard.create({
      data: {
        name: "Platform",
        boardId: "PLAT",
        teamId: platformTeam.id,
      },
    }),
  ]);

  // Create employees
  const employees = await Promise.all([
    prisma.employee.create({
      data: {
        name: "John Doe",
        payrollId: "EMP001",
        roleId: developerRole.id,
        hoursPerWeek: 40,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Jane Smith",
        payrollId: "EMP002",
        roleId: seniorDevRole.id,
        hoursPerWeek: 40,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Alice Johnson",
        payrollId: "EMP003",
        roleId: designerRole.id,
        hoursPerWeek: 40,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Bob Wilson",
        payrollId: "EMP004",
        roleId: managerRole.id,
        hoursPerWeek: 0, // Unset state
      },
    }),
    prisma.employee.create({
      data: {
        name: "Charlie Green",
        payrollId: "EMP005",
        roleId: seniorDevRole.id,
        hoursPerWeek: 30,
      },
    }),
    prisma.employee.create({
      data: {
        name: "Diana Brown",
        payrollId: "EMP006",
        roleId: developerRole.id,
        hoursPerWeek: 0, // Unset state
      },
    }),
  ]);

  // Create team assignments
  const [
    johnDoe,
    janeSmith,
    aliceJohnson,
    bobWilson,
    charlieGreen,
    dianaBrown,
  ] = employees;

  await Promise.all([
    // Current assignments
    prisma.employeeAssignment.create({
      data: {
        employeeId: johnDoe.id,
        teamId: frontendTeam.id,
        startDate: new Date("2024-01-01"),
      },
    }),
    prisma.employeeAssignment.create({
      data: {
        employeeId: janeSmith.id,
        teamId: backendTeam.id,
        startDate: new Date("2024-02-01"),
      },
    }),
    prisma.employeeAssignment.create({
      data: {
        employeeId: aliceJohnson.id,
        teamId: designTeam.id,
        startDate: new Date("2024-01-15"),
      },
    }),
    prisma.employeeAssignment.create({
      data: {
        employeeId: charlieGreen.id,
        teamId: platformTeam.id,
        startDate: new Date("2024-02-15"),
      },
    }),
    // Historical assignments
    prisma.employeeAssignment.create({
      data: {
        employeeId: johnDoe.id,
        teamId: backendTeam.id,
        startDate: new Date("2023-06-01"),
        endDate: new Date("2023-12-31"),
      },
    }),
    prisma.employeeAssignment.create({
      data: {
        employeeId: janeSmith.id,
        teamId: frontendTeam.id,
        startDate: new Date("2023-08-01"),
        endDate: new Date("2024-01-31"),
      },
    }),
    // Future assignment
    prisma.employeeAssignment.create({
      data: {
        employeeId: dianaBrown.id,
        teamId: frontendTeam.id,
        startDate: new Date("2024-03-01"),
      },
    }),
  ]);

  // Create projects
  const webApp = await prisma.project.create({
    data: {
      name: "Web Application",
      description: "Main web application project",
      boardId: webBoard.id,
      jiraId: "WEB-001",
      isCapDev: true,
    },
  });

  const mobileApp = await prisma.project.create({
    data: {
      name: "Mobile App",
      description: "Mobile application development",
      boardId: mobileBoard.id,
      jiraId: "MOB-001",
      isCapDev: true,
    },
  });

  const apiProject = await prisma.project.create({
    data: {
      name: "API Development",
      description: "RESTful API development project",
      boardId: apiBoard.id,
      jiraId: "API-001",
      isCapDev: true,
    },
  });

  const microservices = await prisma.project.create({
    data: {
      name: "Microservices",
      description: "Microservices architecture implementation",
      boardId: microservicesBoard.id,
      jiraId: "MICRO-001",
      isCapDev: true,
    },
  });

  const designSystem = await prisma.project.create({
    data: {
      name: "Design System",
      description: "Company-wide design system",
      boardId: designBoard.id,
      jiraId: "DES-001",
      isCapDev: true,
    },
  });

  const userResearch = await prisma.project.create({
    data: {
      name: "User Research",
      description: "User research and testing",
      boardId: researchBoard.id,
      jiraId: "RES-001",
      isCapDev: false,
    },
  });

  const maintenance = await prisma.project.create({
    data: {
      name: "System Maintenance",
      description: "Ongoing system maintenance and support",
      boardId: maintenanceBoard.id,
      jiraId: "MAINT-001",
      isCapDev: false,
    },
  });

  const platformInfra = await prisma.project.create({
    data: {
      name: "Platform Infrastructure",
      description: "Cloud infrastructure and platform services",
      boardId: platformBoard.id,
      jiraId: "PLAT-001",
      isCapDev: true,
    },
  });

  // Create project activities
  const today = new Date();
  const projectActivities = [
    // Web Application activities (WEB-001)
    {
      jiraIssueId: "WEB-001",
      activityDate: subDays(today, 1),
    },
    {
      jiraIssueId: "WEB-001",
      activityDate: subDays(today, 2),
    },
    // Mobile App activities (MOB-001)
    {
      jiraIssueId: "MOB-001",
      activityDate: subDays(today, 1),
    },
    {
      jiraIssueId: "MOB-001",
      activityDate: today,
    },
    // API Development activities (API-001)
    {
      jiraIssueId: "API-001",
      activityDate: subDays(today, 3),
    },
    {
      jiraIssueId: "API-001",
      activityDate: subDays(today, 1),
    },
    // Microservices activities (MICRO-001)
    {
      jiraIssueId: "MICRO-001",
      activityDate: subDays(today, 2),
    },
    // Design System activities (DES-001)
    {
      jiraIssueId: "DES-001",
      activityDate: subDays(today, 4),
    },
    // Platform Infrastructure activities (PLAT-001)
    {
      jiraIssueId: "PLAT-001",
      activityDate: today,
    },
    {
      jiraIssueId: "PLAT-001",
      activityDate: subDays(today, 1),
    },
  ];

  for (const activity of projectActivities) {
    await prisma.projectActivity.create({
      data: activity,
    });
  }

  // Create time types
  const generalAdmin = await prisma.timeType.create({
    data: {
      name: "General Administration",
      description: "General administrative tasks and emails",
      isCapDev: false,
    },
  });

  const fridayUpdate = await prisma.timeType.create({
    data: {
      name: "Friday Update",
      description: "Weekly team updates and reporting",
      isCapDev: false,
    },
  });

  const personalDev = await prisma.timeType.create({
    data: {
      name: "Personal Development",
      description: "Learning and skill development",
      isCapDev: false,
    },
  });

  const techDebt = await prisma.timeType.create({
    data: {
      name: "Tech Debt",
      description: "Technical debt and improvements",
      isCapDev: true,
    },
  });

  const agileCeremonies = await prisma.timeType.create({
    data: {
      name: "Agile Ceremonies",
      description: "Stand-ups, planning, and retrospectives",
      isCapDev: false,
    },
  });

  // Create general time assignments
  const assignments = [
    // Common assignments for all roles
    {
      roleId: developerRole.id,
      timeTypeId: generalAdmin.id,
      hoursPerWeek: 5,
    },
    {
      roleId: seniorDevRole.id,
      timeTypeId: generalAdmin.id,
      hoursPerWeek: 5,
    },
    {
      roleId: designerRole.id,
      timeTypeId: generalAdmin.id,
      hoursPerWeek: 5,
    },
    {
      roleId: managerRole.id,
      timeTypeId: generalAdmin.id,
      hoursPerWeek: 5,
    },
    // Friday Update for all roles
    {
      roleId: developerRole.id,
      timeTypeId: fridayUpdate.id,
      hoursPerWeek: 1,
    },
    {
      roleId: seniorDevRole.id,
      timeTypeId: fridayUpdate.id,
      hoursPerWeek: 1,
    },
    {
      roleId: designerRole.id,
      timeTypeId: fridayUpdate.id,
      hoursPerWeek: 1,
    },
    {
      roleId: managerRole.id,
      timeTypeId: fridayUpdate.id,
      hoursPerWeek: 1,
    },
    // Personal Development for all roles
    {
      roleId: developerRole.id,
      timeTypeId: personalDev.id,
      hoursPerWeek: 4,
    },
    {
      roleId: seniorDevRole.id,
      timeTypeId: personalDev.id,
      hoursPerWeek: 4,
    },
    {
      roleId: designerRole.id,
      timeTypeId: personalDev.id,
      hoursPerWeek: 4,
    },
    {
      roleId: managerRole.id,
      timeTypeId: personalDev.id,
      hoursPerWeek: 4,
    },
    // Tech Debt for devs only
    {
      roleId: developerRole.id,
      timeTypeId: techDebt.id,
      hoursPerWeek: 4,
    },
    {
      roleId: seniorDevRole.id,
      timeTypeId: techDebt.id,
      hoursPerWeek: 4,
    },
    // Agile Ceremonies for devs only
    {
      roleId: developerRole.id,
      timeTypeId: agileCeremonies.id,
      hoursPerWeek: 2,
    },
    {
      roleId: seniorDevRole.id,
      timeTypeId: agileCeremonies.id,
      hoursPerWeek: 2,
    },
  ];

  for (const assignment of assignments) {
    await prisma.generalTimeAssignment.create({ data: assignment });
  }

  // Create leave records
  const leaveRecords = [
    // John Doe's leave
    {
      date: today,
      type: "Annual Leave",
      status: "TAKEN",
      duration: 1,
      employeeId: johnDoe.id,
    },
    {
      date: subDays(today, 5),
      type: "Sick Leave",
      status: "TAKEN",
      duration: 1,
      employeeId: johnDoe.id,
    },
    // Jane Smith's leave
    {
      date: subDays(today, 1),
      type: "Annual Leave",
      status: "TAKEN",
      duration: 1,
      employeeId: janeSmith.id,
    },
    {
      date: addDays(today, 5),
      type: "Annual Leave",
      status: "APPROVED",
      duration: 5,
      employeeId: janeSmith.id,
    },
    // Alice Johnson's leave
    {
      date: subDays(today, 3),
      type: "Sick Leave",
      status: "TAKEN",
      duration: 2,
      employeeId: aliceJohnson.id,
    },
    // Bob Wilson's leave
    {
      date: addDays(today, 10),
      type: "Annual Leave",
      status: "APPROVED",
      duration: 10,
      employeeId: bobWilson.id,
    },
    // Charlie Green's leave
    {
      date: subDays(today, 2),
      type: "Annual Leave",
      status: "TAKEN",
      duration: 3,
      employeeId: charlieGreen.id,
    },
    // Diana Brown's leave
    {
      date: addDays(today, 3),
      type: "Annual Leave",
      status: "APPROVED",
      duration: 2,
      employeeId: dianaBrown.id,
    },
  ];

  for (const leave of leaveRecords) {
    await prisma.leave.create({ data: leave });
  }

  console.log("Seed data created successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
