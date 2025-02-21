import { prisma } from "@/lib/prisma";
import { jiraClient } from "@/utils/jira";

// Helper to send SSE messages
function sendSSEMessage(
  controller: ReadableStreamDefaultController,
  data: {
    message: string;
    progress: number;
    type?: "info" | "success" | "error" | "warning";
    operation: string;
  }
) {
  console.log(
    `[SSE] ${data.operation}: ${data.message} (Progress: ${data.progress}%)`
  );
  controller.enqueue(`data: ${JSON.stringify(data)}\n\n`);
  // Add a flush message to ensure real-time updates
  controller.enqueue(": flush\n\n");
}

export async function GET(request: Request) {
  console.log("[Sync] Starting sync process");

  // Set up SSE headers
  const responseHeaders = new Headers({
    "Content-Type": "text/event-stream",
    Connection: "keep-alive",
    "Cache-Control": "no-cache",
  });

  // Parse the URL to get the boards parameter
  const url = new URL(request.url);
  const selectedBoards = url.searchParams.get("boards")?.split(",") || ["all"];
  const maxIssuesPerBoard = parseInt(
    url.searchParams.get("maxIssuesPerBoard") || "50",
    10
  );

  console.log(
    `[Sync] Configuration - Selected Boards: ${selectedBoards.join(
      ", "
    )}, Max Issues Per Board: ${maxIssuesPerBoard}`
  );

  const stream = new ReadableStream({
    async start(controller) {
      try {
        let syncTimeout: NodeJS.Timeout;

        // Set a timeout to prevent infinite syncs
        const timeoutPromise = new Promise((_, reject) => {
          syncTimeout = setTimeout(() => {
            console.error("[Sync] Process timed out after 5 minutes");
            reject(new Error("Sync timed out after 5 minutes"));
          }, 5 * 60 * 1000); // 5 minutes timeout
        });

        const syncPromise = async () => {
          try {
            console.log("[Sync] Starting sync promise execution");
            // Get boards from database
            sendSSEMessage(controller, {
              message: "Fetching boards from database...",
              progress: 10,
              type: "info",
              operation: "fetch-boards",
            });

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

            console.log(`[Boards] Found ${boards.length} boards in database`);

            if (!boards.length) {
              console.log(
                "[Boards] No boards found in database, fetching from Jira"
              );
              // Try to fetch and create boards from Jira
              const jiraBoards = await jiraClient.getAllBoards(
                undefined,
                undefined,
                undefined,
                "Toe-Fu"
              );

              console.log(
                `[Boards] Fetched ${
                  jiraBoards?.values?.length || 0
                } boards from Jira`
              );

              if (jiraBoards && jiraBoards.values) {
                // Filter boards if specific ones are selected
                const boardsToCreate =
                  selectedBoards[0] === "all"
                    ? jiraBoards.values
                    : jiraBoards.values.filter((board: { id: number }) =>
                        selectedBoards.includes(board.id.toString())
                      );

                console.log(
                  `[Boards] Creating ${boardsToCreate.length} boards in database`
                );

                // Create boards in database
                const createdBoards = await Promise.all(
                  boardsToCreate.map(
                    async (board: {
                      id: number;
                      name: string;
                      location?: { projectName: string };
                    }) => {
                      console.log(
                        `[Board] Creating board: ${board.name} (ID: ${board.id})`
                      );
                      return prisma.jiraBoard.create({
                        data: {
                          boardId: board.id.toString(),
                          name: board.name,
                          team: {
                            connectOrCreate: {
                              where: {
                                name:
                                  board.location?.projectName || "Unknown Team",
                              },
                              create: {
                                name:
                                  board.location?.projectName || "Unknown Team",
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
                console.log(
                  `[Boards] Successfully created ${createdBoards.length} boards`
                );
              }

              if (!boards.length) {
                console.error("[Boards] No boards found or could be created");
                sendSSEMessage(controller, {
                  message: "No boards found or could be created",
                  progress: 2,
                  type: "error",
                  operation: "fetch-boards",
                });
                throw new Error("No boards found or could be created");
              }
            }

            sendSSEMessage(controller, {
              message: `Successfully fetched ${boards.length} boards`,
              progress: 12,
              type: "success",
              operation: "fetch-boards",
            });

            // Get existing projects
            sendSSEMessage(controller, {
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
                    in:
                      selectedBoards[0] === "all" ? undefined : selectedBoards,
                  },
                },
              },
            });

            sendSSEMessage(controller, {
              message: "Successfully fetched existing projects",
              progress: 22,
              type: "success",
              operation: "fetch-projects",
            });

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
              console.log(
                `[Board ${board.boardId}] Starting processing for board: ${board.name}`
              );
              // Start from 22% and distribute the 73% among boards
              const baseProgress = 22 + boardIndex * progressPerBoard;

              // First, get the actual Jira board details
              console.log(
                `[Board ${board.boardId}] Looking up Jira board details`
              );
              let jiraBoard;
              try {
                console.log(board);
                const jiraBoards = await jiraClient.getAllBoards(
                  undefined,
                  undefined,
                  undefined,
                  board.name
                );

                jiraBoard = jiraBoards?.values?.[0];

                if (!jiraBoard) {
                  console.error(
                    `[Board ${board.boardId}] Board not found in Jira response`
                  );
                  sendSSEMessage(controller, {
                    message: `Board ${board.name} (${board.boardId}) not found in Jira`,
                    progress: Math.round(baseProgress),
                    type: "error",
                    operation: "fetch-board",
                  });
                  continue;
                }

                console.log(
                  `[Board ${board.boardId}] Successfully found Jira board: ${jiraBoard.name} (ID: ${jiraBoard.id})`
                );
              } catch (error) {
                console.error(
                  `[Board ${board.boardId}] Error looking up board in Jira:`,
                  error
                );
                sendSSEMessage(controller, {
                  message: `Failed to lookup board ${board.name} in Jira`,
                  progress: Math.round(baseProgress),
                  type: "error",
                  operation: "fetch-board",
                });
                continue;
              }

              // Get issues for this board
              console.log(
                `[Board ${board.boardId}] Fetching issues for board ${board.name}`
              );
              sendSSEMessage(controller, {
                message: `Fetching issues from board ${board.name}...`,
                progress: Math.round(baseProgress + progressPerBoard * 0.2),
                type: "info",
                operation: `fetch-issues-${board.boardId}`,
              });

              let issues;
              try {
                issues = await jiraClient.getIssuesForBoard(
                  jiraBoard.id,
                  0, // startAt
                  maxIssuesPerBoard, // maxResults
                  "ORDER BY updatedDate DESC" // Get most recently updated issues
                );

                // Send success message to close out the fetch operation
                sendSSEMessage(controller, {
                  message: "Issues fetched successfully",
                  progress: Math.round(baseProgress + progressPerBoard * 0.25),
                  type: "success",
                  operation: `fetch-issues-${board.boardId}`,
                });
              } catch (error) {
                console.error(
                  `[Board ${board.boardId}] Error fetching issues:`,
                  error
                );
                sendSSEMessage(controller, {
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
                console.log(
                  `[Board ${board.boardId}] No issues found for board ${board.name}`
                );
                sendSSEMessage(controller, {
                  message: `No issues found for board ${board.name}`,
                  progress: Math.round(baseProgress + progressPerBoard * 0.5),
                  type: "warning",
                  operation: `board-status-${board.boardId}`,
                });
                continue;
              }

              console.log(
                `[Board ${board.boardId}] Found ${issues.issues.length} issues`
              );
              sendSSEMessage(controller, {
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
                  sendSSEMessage(controller, {
                    message: `Processing issue ${issue.key} (${
                      issueIndex + 1
                    }/${issues.issues.length})`,
                    progress: issueProgress,
                    type: "info",
                    operation: `process-issue-${issue.key}`,
                  });

                  console.log(
                    `[Issue ${issue.key}] Fetching issue details from Jira`
                  );
                  const issueDetails = await jiraClient.getIssue(
                    issue.key,
                    ["summary", "description"],
                    "changelog"
                  );

                  // Update or create project
                  if (existingProjectMap.has(issueDetails.key)) {
                    console.log(
                      `[Issue ${issue.key}] Updating existing project`
                    );
                    await prisma.project.update({
                      where: { id: existingProjectMap.get(issueDetails.key) },
                      data: {
                        name: issueDetails.fields.summary,
                        description: issueDetails.fields.description || null,
                        isCapDev: false,
                        boardId: board.id,
                      },
                    });
                  } else {
                    console.log(`[Issue ${issue.key}] Creating new project`);
                    await prisma.project.create({
                      data: {
                        name: issueDetails.fields.summary,
                        description: issueDetails.fields.description || null,
                        jiraId: issueDetails.key,
                        isCapDev: false,
                        boardId: board.id,
                      },
                    });
                  }

                  // Process activities
                  console.log(`[Issue ${issue.key}] Processing activities`);
                  await prisma.projectActivity.deleteMany({
                    where: { jiraIssueId: issueDetails.key },
                  });

                  if (
                    issueDetails.changelog &&
                    issueDetails.changelog.histories
                  ) {
                    const activityDates = new Set<string>(
                      issueDetails.changelog.histories
                        .filter(
                          (history: { author: { displayName: string } }) => {
                            const authorName = history.author.displayName;
                            return (
                              authorName !== "Recurring Tasks for Jira Cloud" &&
                              authorName !== "VCS Automation"
                            );
                          }
                        )
                        .map((history: { created: string }) => {
                          return history.created;
                        })
                    );

                    if (activityDates.size > 0) {
                      await prisma.projectActivity.createMany({
                        data: Array.from(activityDates).map(
                          (dateString: string) => {
                            const date = new Date(dateString);
                            return {
                              jiraIssueId: issueDetails.key,
                              activityDate: date,
                            };
                          }
                        ),
                      });
                    }
                  }

                  sendSSEMessage(controller, {
                    message: `Successfully processed issue ${issue.key} (${issueDetails.fields.summary})`,
                    progress: issueProgress,
                    type: "success",
                    operation: `process-issue-${issue.key}`,
                  });
                } catch (error) {
                  console.error(
                    `[Issue ${issue.key}] Error processing issue:`,
                    error
                  );
                  sendSSEMessage(controller, {
                    message: `Error processing issue ${issue.key}: ${
                      error instanceof Error ? error.message : "Unknown error"
                    }`,
                    progress: issueProgress,
                    type: "error",
                    operation: `process-issue-${issue.key}`,
                  });
                }
              }

              // Board completion message
              sendSSEMessage(controller, {
                message: `Completed processing board ${board.name}`,
                progress: Math.round(baseProgress + progressPerBoard),
                type: "success",
                operation: "process-board",
              });

              console.log(
                `[Board ${board.boardId}] Completed processing all issues`
              );
            }

            console.log("[Sync] All boards processed successfully");
            sendSSEMessage(controller, {
              message: "Finalizing sync...",
              progress: 97,
              type: "info",
              operation: "finalize",
            });

            // Send completion message
            sendSSEMessage(controller, {
              message: "Sync complete!",
              progress: 100,
              type: "success",
              operation: "finalize",
            });

            // Send completion event
            controller.enqueue(`event: sync-complete\ndata: {}\n\n`);
          } finally {
            clearTimeout(syncTimeout);
          }
        };

        // Race between sync and timeout
        await Promise.race([syncPromise(), timeoutPromise]);

        // Close the stream
        controller.close();
      } catch (error) {
        console.error("[Sync] Fatal error:", error);

        // Send error message to client
        sendSSEMessage(controller, {
          message:
            error instanceof Error
              ? error.message
              : "An unknown error occurred during sync",
          progress: 0,
          type: "error",
          operation: "sync-error",
        });

        // Send completion event even on error
        controller.enqueue(`event: sync-complete\ndata: {}\n\n`);
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: responseHeaders });
}
