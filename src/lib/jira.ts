import JiraApi from "jira-client";
import { prisma } from "./prisma";

interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
}

export class JiraClient {
  private client: JiraApi;

  constructor() {
    this.client = new JiraApi({
      protocol: "https",
      host: process.env.JIRA_HOST!,
      username: process.env.JIRA_EMAIL!,
      password: process.env.JIRA_API_TOKEN!,
      apiVersion: "2",
      strictSSL: true,
    });
  }

  async syncProjects() {
    try {
      // Get all Jira projects
      const jiraProjects = (await this.client.getProjects("")) as JiraProject[];

      // Get or create the default team
      const defaultTeam = await prisma.team.upsert({
        where: { name: "Default Team" },
        update: {},
        create: {
          name: "Default Team",
          description: "Default team for new projects",
        },
      });

      for (const jiraProject of jiraProjects) {
        // Create or get the Jira board
        const board = await prisma.jiraBoard.upsert({
          where: {
            teamId_boardId: {
              teamId: defaultTeam.id,
              boardId: jiraProject.id,
            },
          },
          update: {
            name: jiraProject.name,
          },
          create: {
            name: jiraProject.name,
            boardId: jiraProject.id,
            teamId: defaultTeam.id,
          },
        });

        // Create or update the project
        const project = await prisma.project.upsert({
          where: { jiraId: jiraProject.key },
          update: {
            name: jiraProject.name,
            description: jiraProject.description || "",
            boardId: board.id,
          },
          create: {
            jiraId: jiraProject.key,
            name: jiraProject.name,
            description: jiraProject.description || "",
            isCapDev: false,
            boardId: board.id,
          },
        });

        // Record the sync activity
        await prisma.projectActivity.create({
          data: {
            jiraIssueId: jiraProject.key,
            activityDate: new Date(),
          },
        });
      }
    } catch (error) {
      console.error("Error syncing projects:", error);
      throw error;
    }
  }
}
