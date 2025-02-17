import { PrismaClient } from "@prisma/client";
import { addDays, startOfWeek, subWeeks } from "date-fns";

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

  // Create users with their teams
  const johnDoe = await prisma.user.create({
    data: {
      name: "John Doe",
      email: "john.doe@example.com",
      role: "USER",
      teams: {
        connect: { id: frontendTeam.id },
      },
    },
    include: {
      teams: true,
    },
  });

  const janeSmith = await prisma.user.create({
    data: {
      name: "Jane Smith",
      email: "jane.smith@example.com",
      role: "USER",
      teams: {
        connect: { id: backendTeam.id },
      },
    },
    include: {
      teams: true,
    },
  });

  const aliceJohnson = await prisma.user.create({
    data: {
      name: "Alice Johnson",
      email: "alice.johnson@example.com",
      role: "USER",
      teams: {
        connect: { id: designTeam.id },
      },
    },
    include: {
      teams: true,
    },
  });

  // Create projects
  const webApp = await prisma.project.create({
    data: {
      name: "Web Application",
      description: "Main web application project",
      teamId: frontendTeam.id,
    },
  });

  const apiProject = await prisma.project.create({
    data: {
      name: "API Development",
      description: "RESTful API development project",
      teamId: backendTeam.id,
    },
  });

  const designSystem = await prisma.project.create({
    data: {
      name: "Design System",
      description: "Company-wide design system",
      teamId: designTeam.id,
    },
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

  const designType = await prisma.timeType.create({
    data: {
      name: "Design",
      description: "UI/UX design work",
      isCapDev: true,
    },
  });

  // Create time entries for the last 4 weeks
  const users = [johnDoe, janeSmith, aliceJohnson];
  const projects = [webApp, apiProject, designSystem];
  const timeTypes = [developmentType, maintenanceType, meetingType, designType];

  for (let weekOffset = 0; weekOffset < 4; weekOffset++) {
    const weekStart = startOfWeek(subWeeks(new Date(), weekOffset));

    for (const user of users) {
      // Determine relevant projects and time types based on user's team
      let relevantProjects = projects;
      let relevantTimeTypes = timeTypes;

      const userTeam = user.teams[0];
      if (userTeam.id === frontendTeam.id) {
        relevantProjects = [webApp];
        relevantTimeTypes = [developmentType, maintenanceType, meetingType];
      } else if (userTeam.id === backendTeam.id) {
        relevantProjects = [apiProject];
        relevantTimeTypes = [developmentType, maintenanceType, meetingType];
      } else {
        relevantProjects = [designSystem];
        relevantTimeTypes = [designType, meetingType];
      }

      // Create entries for each day of the week
      for (let day = 0; day < 5; day++) {
        const date = addDays(weekStart, day);
        const dailyHours = 8; // 8 hours per day
        let remainingHours = dailyHours;

        // Distribute hours among different time types
        while (remainingHours > 0) {
          const timeType =
            relevantTimeTypes[
              Math.floor(Math.random() * relevantTimeTypes.length)
            ];
          const project =
            relevantProjects[
              Math.floor(Math.random() * relevantProjects.length)
            ];
          const hours = Math.min(remainingHours, Math.random() * 4 + 1);

          await prisma.timeEntry.create({
            data: {
              date,
              hours,
              description: `Work on ${project.name}`,
              userId: user.id,
              projectId: project.id,
              timeTypeId: timeType.id,
            },
          });

          remainingHours -= hours;
        }
      }
    }
  }

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
        timeTypeId: designType.id,
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
