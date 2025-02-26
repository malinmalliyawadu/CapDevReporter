"use server";

import { prisma } from "@/lib/prisma";
import { jiraClient } from "@/lib/jira";
import { checkForCapDevLabel } from "@/lib/jira-utils";

export interface JiraBoard {
  id: string;
  boardId: string;
  name: string;
  team: {
    name: string;
  };
}

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

    return { success: true, data: boards };
  } catch (error) {
    console.error("Error fetching boards:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch boards",
    };
  }
}

export type SyncMessage = {
  message: string;
  progress: number;
  type?: "info" | "success" | "error" | "warning";
  operation?: string;
};

export type SyncConfig = {
  boards: string[];
  maxIssuesPerBoard: number;
  issueKey?: string;
};

export async function* syncProjects(config: SyncConfig) {
  console.log("[Sync] Starting sync process");

  const { issueKey, boards: selectedBoards, maxIssuesPerBoard } = config;

  try {
    if (issueKey) {
      // Single issue sync mode
      yield {
        message: `Fetching issue ${issueKey}...`,
        progress: 10,
        type: "info",
        operation: "fetch-issue",
      } as SyncMessage;

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

        yield {
          message: `Successfully synced issue ${issueKey}`,
          progress: 100,
          type: "success",
          operation: "sync-issue",
        } as SyncMessage;

        return;
      } catch (error: unknown) {
        console.error(`Error syncing issue ${issueKey}:`, error);
        yield {
          message: `Failed to sync issue ${issueKey}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          progress: 0,
          type: "error",
          operation: "sync-error",
        } as SyncMessage;
        throw error;
      }
    }

    // If no issue key, proceed with board-based sync
    // Get boards from database
    yield {
      message: "Fetching boards from database...",
      progress: 10,
      type: "info",
      operation: "fetch-boards",
    } as SyncMessage;

    const boards = await prisma.jiraBoard.findMany({
      include: {
        team: true,
      },
      ...(selectedBoards[0] !== "all" && {
        where: {
          boardId: {
            in: selectedBoards,
          },
        },
      }),
    });

    if (!boards.length) {
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
          selectedBoards[0] === "all"
            ? jiraBoards.values
            : jiraBoards.values.filter((board: { id: number }) =>
                selectedBoards.includes(board.id.toString())
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
        boards.push(...createdBoards);
      }

      if (!boards.length) {
        yield {
          message: "No boards found or could be created",
          progress: 2,
          type: "error",
          operation: "fetch-boards",
        } as SyncMessage;
        throw new Error("No boards found or could be created");
      }
    }

    yield {
      message: `Successfully fetched ${boards.length} boards`,
      progress: 12,
      type: "success",
      operation: "fetch-boards",
    } as SyncMessage;

    // Get existing projects
    yield {
      message: "Fetching existing projects...",
      progress: 17,
      type: "info",
      operation: "fetch-projects",
    } as SyncMessage;

    const existingProjects = await prisma.project.findMany({
      select: { id: true, jiraId: true },
      where: {
        board: {
          boardId: {
            in: selectedBoards[0] === "all" ? undefined : selectedBoards,
          },
        },
      },
    });

    yield {
      message: "Successfully fetched existing projects",
      progress: 22,
      type: "success",
      operation: "fetch-projects",
    } as SyncMessage;

    const existingProjectMap = new Map(
      existingProjects.map((p: { jiraId: string; id: string }) => [
        p.jiraId,
        p.id,
      ])
    );

    const totalBoards = boards.length;
    // Reserve 73% of progress (from 22% to 95%) for processing boards
    const progressPerBoard = 73 / totalBoards;

    // Process each board
    for (let boardIndex = 0; boardIndex < boards.length; boardIndex++) {
      const board = boards[boardIndex];
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
          yield {
            message: `Board ${board.name} (${board.boardId}) not found in Jira or missing project key`,
            progress: Math.round(baseProgress),
            type: "error",
            operation: "fetch-board",
          } as SyncMessage;
          continue;
        }
      } catch (error) {
        yield {
          message: `Failed to lookup board ${board.name} in Jira: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          progress: Math.round(baseProgress),
          type: "error",
          operation: "fetch-board",
        } as SyncMessage;
        continue;
      }

      // Get issues for this board
      yield {
        message: `Fetching issues from board ${board.name}...`,
        progress: Math.round(baseProgress + progressPerBoard * 0.2),
        type: "info",
        operation: `fetch-issues-${board.boardId}`,
      } as SyncMessage;

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

        yield {
          message: "Issues fetched successfully",
          progress: Math.round(baseProgress + progressPerBoard * 0.25),
          type: "success",
          operation: `fetch-issues-${board.boardId}`,
        } as SyncMessage;
      } catch (error) {
        yield {
          message: `Error fetching issues: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          progress: Math.round(baseProgress + progressPerBoard * 0.25),
          type: "error",
          operation: `fetch-issues-${board.boardId}`,
        } as SyncMessage;
        continue;
      }

      if (!issues?.issues?.length) {
        yield {
          message: `No issues found for board ${board.name}`,
          progress: Math.round(baseProgress + progressPerBoard * 0.5),
          type: "warning",
          operation: `board-status-${board.boardId}`,
        } as SyncMessage;
        continue;
      }

      yield {
        message: `Found ${issues.issues.length} issues in board ${board.name}`,
        progress: Math.round(baseProgress + progressPerBoard * 0.3),
        type: "success",
        operation: `board-status-${board.boardId}`,
      } as SyncMessage;

      // Process each issue
      const progressPerIssue = (progressPerBoard * 0.6) / issues.issues.length;
      for (
        let issueIndex = 0;
        issueIndex < issues.issues.length;
        issueIndex++
      ) {
        const issue = issues.issues[issueIndex];
        const issueProgress = Math.round(
          baseProgress + progressPerBoard * 0.3 + progressPerIssue * issueIndex
        );

        try {
          yield {
            message: `Processing issue ${issue.key} (${issueIndex + 1}/${
              issues.issues.length
            })`,
            progress: issueProgress,
            type: "info",
            operation: `process-issue-${issue.key}`,
          } as SyncMessage;

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
                .map((history: { created: string }) => history.created)
            );

            if (activityDates.size > 0) {
              await prisma.projectActivity.createMany({
                data: Array.from(activityDates).map((dateString: string) => ({
                  jiraIssueId: issueDetails.key,
                  activityDate: new Date(dateString),
                })),
              });
            }
          }

          yield {
            message: `Successfully processed issue ${issue.key} (${issueDetails.fields.summary})`,
            progress: issueProgress,
            type: "success",
            operation: `process-issue-${issue.key}`,
          } as SyncMessage;
        } catch (error) {
          yield {
            message: `Error processing issue: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            progress: issueProgress,
            type: "error",
            operation: `process-issue-${issue.key}`,
          } as SyncMessage;
        }
      }
    }

    yield {
      message: "Finalizing sync...",
      progress: 97,
      type: "info",
      operation: "finalize",
    } as SyncMessage;

    yield {
      message: "Sync complete!",
      progress: 100,
      type: "success",
      operation: "finalize",
    } as SyncMessage;
  } catch (error) {
    console.error("[Sync] Error in sync process:", error);
    yield {
      message: `Error in sync process: ${
        error instanceof Error ? error.message : "Unknown error"
      }`,
      progress: 100,
      type: "error",
      operation: "sync-error",
    } as SyncMessage;
  }
}
