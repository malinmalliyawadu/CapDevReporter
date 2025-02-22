import JiraApi from "jira-client";
import { prisma } from "./prisma";
import { jiraClient } from "@/utils/jira";

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
      // 1. Get all boards from our database
      const boards = await prisma.jiraBoard.findMany({
        where: {
          boardId: "TF",
        },
      });

      // 2. Get all existing projects from our database
      const existingProjects = await prisma.project.findMany({
        select: {
          id: true,
          jiraId: true,
        },
      });

      // Create a map for faster lookups
      const existingProjectMap = new Map(
        existingProjects.map((p) => [p.jiraId, p.id])
      );
      const processedJiraIds = new Set();

      // 3. Process each board and its projects
      for (const board of boards) {
        // Get all Jira projects with the board's ID
        console.log(board);
        const jiraBoard = await jiraClient.getAllBoards(
          undefined,
          undefined,
          undefined,
          "Toe-Fu"
        );

        const jiraIssues = await jiraClient.getIssuesForBoard(
          jiraBoard.values[0].id,
          0,
          100,
          "ORDER BY updatedDate desc"
        );

        for (const iss of jiraIssues.issues) {
          const issue = await jiraClient.getIssue(
            iss.key,
            ["summary", "description"],
            "changelog"
          );

          processedJiraIds.add(issue.key);

          console.log(issue.key);
          console.log(existingProjectMap.has(issue.key));

          // Use a transaction to ensure atomicity of project and activity updates
          await prisma.$transaction(async (tx) => {
            // Update or create project
            if (existingProjectMap.has(issue.key)) {
              // Update existing project
              await tx.project.update({
                where: { id: existingProjectMap.get(issue.key) },
                data: {
                  name: issue.fields.summary,
                  description: issue.fields.description || null,
                  isCapDev: false,
                  boardId: board.id,
                },
              });
              console.log("updated");
            } else {
              // Create new project
              await tx.project.create({
                data: {
                  name: issue.fields.summary,
                  description: issue.fields.description || null,
                  jiraId: issue.key,
                  isCapDev: false,
                  boardId: board.id,
                },
              });
              console.log("created");
            }

            // Process activities
            // First clear existing activities
            await tx.projectActivity.deleteMany({
              where: {
                jiraIssueId: issue.key,
              },
            });

            // Then process and add new activities
            if (issue.changelog && issue.changelog.histories) {
              const activityDates = new Set<string>();

              // Process and normalize dates
              issue.changelog.histories
                .filter((history: { author: { displayName: string } }) => {
                  const authorName = history.author.displayName;
                  return (
                    authorName !== "Recurring Tasks for Jira Cloud" &&
                    authorName !== "VCS Automation"
                  );
                })
                .forEach((history: { created: string }) => {
                  // Normalize date to YYYY-MM-DD format in UTC
                  const date = new Date(history.created);
                  const normalizedDate = date.toISOString().split("T")[0];
                  activityDates.add(normalizedDate);
                });

              if (activityDates.size > 0) {
                // Create activities in bulk
                await tx.projectActivity.createMany({
                  data: Array.from(activityDates).map((dateString) => ({
                    jiraIssueId: issue.key,
                    activityDate: new Date(dateString),
                  })),
                });
              }
            }
          });
        }
      }

      console.log(processedJiraIds);

      return {
        success: true,
        message: "Projects synced with Jira",
        timestamp: new Date(),
      };
    } catch (error) {
      console.error("Failed to sync with Jira:", error);
      throw new Error("Failed to sync with Jira");
    }
  }
}
