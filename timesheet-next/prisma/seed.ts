import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Create roles
  const developerRole = await prisma.role.create({
    data: {
      name: "Software Developer",
      description: "Develops and maintains software applications",
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

  // Create employees
  await prisma.employee.createMany({
    data: [
      {
        name: "John Doe",
        payrollId: "EMP001",
        hoursPerWeek: 40,
        teamId: frontendTeam.id,
        roleId: developerRole.id,
      },
      {
        name: "Jane Smith",
        payrollId: "EMP002",
        hoursPerWeek: 40,
        teamId: backendTeam.id,
        roleId: developerRole.id,
      },
      {
        name: "Alice Johnson",
        payrollId: "EMP003",
        hoursPerWeek: 40,
        teamId: designTeam.id,
        roleId: designerRole.id,
      },
      {
        name: "Bob Wilson",
        payrollId: "EMP004",
        hoursPerWeek: 40,
        teamId: frontendTeam.id,
        roleId: managerRole.id,
      },
    ],
  });

  // Create time types
  const developmentType = await prisma.timeType.create({
    data: {
      name: "Development",
      description: "Software development work",
      isCapDev: true,
    },
  });

  const maintenanceType = await prisma.timeType.create({
    data: {
      name: "Maintenance",
      description: "System maintenance and support",
      isCapDev: false,
    },
  });

  const meetingType = await prisma.timeType.create({
    data: {
      name: "Meeting",
      description: "Team meetings and discussions",
      isCapDev: false,
    },
  });

  // Create general time assignments
  await prisma.generalTimeAssignment.createMany({
    data: [
      {
        roleId: developerRole.id,
        timeTypeId: developmentType.id,
        hoursPerWeek: 30,
      },
      {
        roleId: developerRole.id,
        timeTypeId: maintenanceType.id,
        hoursPerWeek: 5,
      },
      {
        roleId: developerRole.id,
        timeTypeId: meetingType.id,
        hoursPerWeek: 5,
      },
      {
        roleId: designerRole.id,
        timeTypeId: developmentType.id,
        hoursPerWeek: 25,
      },
      {
        roleId: designerRole.id,
        timeTypeId: meetingType.id,
        hoursPerWeek: 15,
      },
      {
        roleId: managerRole.id,
        timeTypeId: meetingType.id,
        hoursPerWeek: 25,
      },
      {
        roleId: managerRole.id,
        timeTypeId: maintenanceType.id,
        hoursPerWeek: 15,
      },
    ],
  });

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
