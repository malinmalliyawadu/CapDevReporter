"use server";

import { jiraClient } from "@/utils/jira";
import { prisma } from "@/lib/prisma";

// Helper function to check for capdev label up the parent chain
async function checkForCapDevLabel(
  issueKey: string,
  depth = 0
): Promise<boolean> {
  if (depth > 5) return false; // Prevent infinite loops by limiting depth

  try {
    const issue = await jiraClient.getIssue(
      issueKey,
      ["labels", "parent"],
      undefined
    );

    // Check current issue's labels
    const hasCapDev =
      issue.fields.labels?.some(
        (label: string) => label.toLowerCase() === "capdev"
      ) ?? false;

    if (hasCapDev) return true;

    // If no capdev label and has parent, check parent
    if (issue.fields.parent) {
      return checkForCapDevLabel(issue.fields.parent.key, depth + 1);
    }

    return false;
  } catch (error) {
    console.error(`Error checking capdev label for ${issueKey}:`, error);
    return false;
  }
}

export type SyncMessage = {
  message: string;
  progress: number;
  type: "info" | "success" | "error" | "warning";
  operation?: string;
};

export async function getBoards() {
  try {
    const boards = await prisma.jiraBoard.findMany({
      include: {
        team: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return { success: true, boards };
  } catch (error) {
    console.error("Failed to fetch boards:", error);
    return { success: false, error: "Failed to fetch boards" };
  }
}

export async function syncProjects(config: {
  issueKey?: string;
  boards?: string[];
  maxIssuesPerBoard?: number;
}) {
  const { issueKey, boards = ["all"], maxIssuesPerBoard = 50 } = config;

  const encoder = new TextEncoder();
  const stream = new TransformStream();
  const writer = stream.writable.getWriter();

  const sendMessage = async (message: SyncMessage) => {
    await writer.write(encoder.encode(JSON.stringify(message) + "\n"));
  };

  const cleanup = async () => {
    try {
      await writer.close();
    } catch (error) {
      console.error("Error closing writer:", error);
    }
  };

  // Start the sync process in the background
  (async () => {
    try {
      if (issueKey) {
        // Single issue sync mode
        await sendMessage({
          message: `Fetching issue ${issueKey}...`,
          progress: 10,
          type: "info",
          operation: "fetch-issue",
        });

        try {
          const issue = await jiraClient.getIssue(
            issueKey,
            [
              "summary",
              "description",
              "status",
              "labels",
              "parent",
              "project",
              "project.projectCategory",
            ],
            undefined
          );

          if (!issue) {
            throw new Error(`Issue ${issueKey} not found`);
          }

          // Check for CapDev label
          const hasCapDev = await checkForCapDevLabel(issueKey);

          // Create or update the project
          await prisma.project.upsert({
            where: { jiraId: issue.key },
            create: {
              name: issue.fields.summary,
              description: issue.fields.description || "",
              jiraId: issue.key,
              isCapDev: hasCapDev,
              board: {
                connectOrCreate: {
                  where: { id: issue.fields.project.id.toString() },
                  create: {
                    boardId: issue.fields.project.id.toString(),
                    name: issue.fields.project.name,
                    team: {
                      connectOrCreate: {
                        where: {
                          name:
                            issue.fields.project.projectCategory?.name ||
                            "Unknown Team",
                        },
                        create: {
                          name:
                            issue.fields.project.projectCategory?.name ||
                            "Unknown Team",
                        },
                      },
                    },
                  },
                },
              },
            },
            update: {
              name: issue.fields.summary,
              description: issue.fields.description || "",
              isCapDev: hasCapDev,
            },
          });

          await sendMessage({
            message: `Successfully synced issue ${issueKey}`,
            progress: 100,
            type: "success",
            operation: "sync-issue",
          });

          await cleanup();
          return;
        } catch (error) {
          console.error(`Error syncing issue ${issueKey}:`, error);
          await sendMessage({
            message: `Failed to sync issue ${issueKey}: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            progress: 0,
            type: "error",
            operation: "sync-error",
          });
          await cleanup();
          throw error;
        }
      }

      // If no issue key, proceed with board-based sync
      // Get boards from database
      await sendMessage({
        message: "Fetching boards from database...",
        progress: 10,
        type: "info",
        operation: "fetch-boards",
      });

      const dbBoards = await prisma.jiraBoard.findMany({
        include: {
          team: true,
        },
        ...(boards[0] !== "all" && {
          where: {
            boardId: {
              in: boards,
            },
          },
        }),
      });

      if (!dbBoards.length) {
        // Try to fetch and create boards from Jira
        const jiraBoards = await jiraClient.getAllBoards(
          undefined,
          undefined,
          undefined,
          "Toe-Fu"
        );

        if (jiraBoards && jiraBoards.values) {
          // Filter boards if specific ones are selected
          const boardsToCreate =
            boards[0] === "all"
              ? jiraBoards.values
              : jiraBoards.values.filter((board: { id: number }) =>
                  boards.includes(board.id.toString())
                );

          // Create boards in database
          const createdBoards = await Promise.all(
            boardsToCreate.map(
              async (board: {
                id: number;
                name: string;
                location?: { projectName: string };
              }) => {
                return prisma.jiraBoard.create({
                  data: {
                    boardId: board.id.toString(),
                    name: board.name,
                    team: {
                      connectOrCreate: {
                        where: {
                          name: board.location?.projectName || "Unknown Team",
                        },
                        create: {
                          name: board.location?.projectName || "Unknown Team",
                        },
                      },
                    },
                  },
                  include: {
                    team: true,
                  },
                });
              }
            )
          );
          dbBoards.push(...createdBoards);
        }

        if (!dbBoards.length) {
          await sendMessage({
            message: "No boards found or could be created",
            progress: 2,
            type: "error",
            operation: "fetch-boards",
          });
          await cleanup();
          throw new Error("No boards found or could be created");
        }
      }

      await sendMessage({
        message: `Successfully fetched ${dbBoards.length} boards`,
        progress: 12,
        type: "success",
        operation: "fetch-boards",
      });

      // Get existing projects
      await sendMessage({
        message: "Fetching existing projects...",
        progress: 17,
        type: "info",
        operation: "fetch-projects",
      });

      const existingProjects = await prisma.project.findMany({
        select: { id: true, jiraId: true },
        where: {
          board: {
            boardId: {
              in: boards[0] === "all" ? undefined : boards,
            },
          },
        },
      });

      await sendMessage({
        message: "Successfully fetched existing projects",
        progress: 22,
        type: "success",
        operation: "fetch-projects",
      });

      const existingProjectMap = new Map(
        existingProjects.map((p) => [p.jiraId, p.id])
      );

      const totalBoards = dbBoards.length;
      // Reserve 73% of progress (from 22% to 95%) for processing boards
      const progressPerBoard = 73 / totalBoards;

      // Process each board
      for (let boardIndex = 0; boardIndex < dbBoards.length; boardIndex++) {
        const board = dbBoards[boardIndex];
        // Start from 22% and distribute the 73% among boards
        const baseProgress = 22 + boardIndex * progressPerBoard;

        // First, get the actual Jira board details
        let jiraBoard;
        try {
          const jiraBoards = await jiraClient.getAllBoards(
            undefined,
            undefined,
            undefined,
            board.name
          );

          jiraBoard = jiraBoards?.values?.[0];

          if (!jiraBoard || !jiraBoard.location?.projectKey) {
            await sendMessage({
              message: `Board ${board.name} (${board.boardId}) not found in Jira or missing project key`,
              progress: Math.round(baseProgress),
              type: "error",
              operation: "fetch-board",
            });
            continue;
          }
        } catch (error) {
          await sendMessage({
            message: `Failed to lookup board ${board.name} in Jira`,
            progress: Math.round(baseProgress),
            type: "error",
            operation: "fetch-board",
          });
          continue;
        }

        // Get issues for this board, prioritizing higher-level issues
        await sendMessage({
          message: `Fetching issues from board ${board.name}...`,
          progress: Math.round(baseProgress + progressPerBoard * 0.2),
          type: "info",
          operation: `fetch-issues-${board.boardId}`,
        });

        let issues;
        try {
          // First fetch initiatives and epics
          const jql = `project = "${jiraBoard.location.projectKey}" AND issuetype in (Initiative, Epic) ORDER BY issuetype ASC, updatedDate DESC`;
          issues = await jiraClient.getIssuesForBoard(
            jiraBoard.id,
            0,
            maxIssuesPerBoard,
            jql
          );

          // Then fetch stories and other issue types
          const otherIssues = await jiraClient.getIssuesForBoard(
            jiraBoard.id,
            0,
            maxIssuesPerBoard,
            `project = "${jiraBoard.location.projectKey}" AND issuetype not in (Initiative, Epic) ORDER BY updatedDate DESC`
          );

          // Combine the results, prioritizing higher-level issues
          issues.issues = [
            ...issues.issues,
            ...(otherIssues?.issues || []),
          ].slice(0, maxIssuesPerBoard);

          // Send success message to close out the fetch operation
          await sendMessage({
            message: "Issues fetched successfully",
            progress: Math.round(baseProgress + progressPerBoard * 0.25),
            type: "success",
            operation: `fetch-issues-${board.boardId}`,
          });
        } catch (error) {
          await sendMessage({
            message: `Error fetching issues: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            progress: Math.round(baseProgress + progressPerBoard * 0.25),
            type: "error",
            operation: `fetch-issues-${board.boardId}`,
          });
          continue;
        }

        if (!issues?.issues?.length) {
          await sendMessage({
            message: `No issues found for board ${board.name}`,
            progress: Math.round(baseProgress + progressPerBoard * 0.5),
            type: "warning",
            operation: `board-status-${board.boardId}`,
          });
          continue;
        }

        await sendMessage({
          message: `Found ${issues.issues.length} issues in board ${board.name}`,
          progress: Math.round(baseProgress + progressPerBoard * 0.3),
          type: "success",
          operation: `board-status-${board.boardId}`,
        });

        // Process each issue
        const progressPerIssue =
          (progressPerBoard * 0.6) / issues.issues.length;
        for (
          let issueIndex = 0;
          issueIndex < issues.issues.length;
          issueIndex++
        ) {
          const issue = issues.issues[issueIndex];
          const issueProgress = Math.round(
            baseProgress +
              progressPerBoard * 0.3 +
              progressPerIssue * issueIndex
          );

          try {
            await sendMessage({
              message: `Processing issue ${issue.key} (${issueIndex + 1}/${
                issues.issues.length
              })`,
              progress: issueProgress,
              type: "info",
              operation: `process-issue-${issue.key}`,
            });

            const issueDetails = await jiraClient.getIssue(
              issue.key,
              ["summary", "description", "labels"],
              "changelog"
            );

            // Check if issue has capdev label
            const isCapDev = await checkForCapDevLabel(issue.key);

            // Update or create project
            if (existingProjectMap.has(issueDetails.key)) {
              await prisma.project.update({
                where: { id: existingProjectMap.get(issueDetails.key) },
                data: {
                  name: issueDetails.fields.summary,
                  description: issueDetails.fields.description || null,
                  isCapDev: isCapDev,
                  boardId: board.id,
                },
              });
            } else {
              await prisma.project.create({
                data: {
                  name: issueDetails.fields.summary,
                  description: issueDetails.fields.description || null,
                  jiraId: issueDetails.key,
                  isCapDev: isCapDev,
                  boardId: board.id,
                },
              });
            }

            // Process activities
            await prisma.projectActivity.deleteMany({
              where: { jiraIssueId: issueDetails.key },
            });

            if (issueDetails.changelog && issueDetails.changelog.histories) {
              const activityDates = new Set<string>(
                issueDetails.changelog.histories
                  .filter((history: { author: { displayName: string } }) => {
                    const authorName = history.author.displayName;
                    return (
                      authorName !== "Recurring Tasks for Jira Cloud" &&
                      authorName !== "VCS Automation"
                    );
                  })
                  .map((history: { created: string }) => {
                    return history.created;
                  })
              );

              if (activityDates.size > 0) {
                await prisma.projectActivity.createMany({
                  data: Array.from(activityDates).map((dateString: string) => {
                    const date = new Date(dateString);
                    return {
                      jiraIssueId: issueDetails.key,
                      activityDate: date,
                    };
                  }),
                });
              }
            }

            await sendMessage({
              message: `Successfully processed issue ${issue.key} (${issueDetails.fields.summary})`,
              progress: issueProgress,
              type: "success",
              operation: `process-issue-${issue.key}`,
            });
          } catch (error) {
            await sendMessage({
              message: `Error processing issue: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
              progress: issueProgress,
              type: "error",
              operation: `process-issue-${issue.key}`,
            });
          }
        }
      }

      await sendMessage({
        message: "Finalizing sync...",
        progress: 97,
        type: "info",
        operation: "finalize",
      });

      await sendMessage({
        message: "Sync complete!",
        progress: 100,
        type: "success",
        operation: "finalize",
      });
    } catch (error) {
      console.error("[Sync] Error in sync process:", error);
      await sendMessage({
        message: `Error in sync process: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        progress: 100,
        type: "error",
        operation: "sync-error",
      });
    } finally {
      await cleanup();
    }
  })();

  return stream.readable;
}
