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

              sendSSEMessage(controller, {
                message: `Fetching issues for board ${board.name} (${board.boardId})...`,
                progress: Math.round(baseProgress + progressPerBoard * 0.1),
                type: "info",
                operation: "fetch-issues",
              });

              let jiraIssues;
              try {
                console.log(
                  `[Board ${board.boardId}] Fetching issues from Jira`
                );
                jiraIssues = await jiraClient.getIssuesForBoard(
                  jiraBoard.id,
                  0,
                  maxIssuesPerBoard,
                  "ORDER BY updatedDate desc"
                );

                // Update progress after successful fetch
                sendSSEMessage(controller, {
                  message: `Successfully fetched ${
                    jiraIssues?.issues?.length || 0
                  } issues from board ${board.name}`,
                  progress: Math.round(baseProgress + progressPerBoard * 0.2),
                  type: "success",
                  operation: "fetch-issues",
                });

                console.log(
                  `[Board ${board.boardId}] Successfully fetched ${
                    jiraIssues?.issues?.length || 0
                  } issues`
                );
              } catch (error) {
                console.error(
                  `[Board ${board.boardId}] Error fetching issues:`,
                  error
                );
                sendSSEMessage(controller, {
                  message: `Failed to fetch issues for board ${board.name}`,
                  progress: Math.round(baseProgress + progressPerBoard * 0.3),
                  type: "error",
                  operation: "fetch-issues",
                });
                // Continue to next board instead of throwing
                continue;
              }

              if (!jiraIssues || !jiraIssues.issues) {
                sendSSEMessage(controller, {
                  message: `No issues found for board ${board.name}`,
                  progress: Math.round(baseProgress + progressPerBoard * 0.3),
                  type: "warning",
                  operation: "fetch-issues",
                });
                continue;
              }

              const totalIssues = jiraIssues.issues.length;
              let processedCount = 0;

              // Process each issue
              for (const issue of jiraIssues.issues) {
                // Calculate progress within this board's allocation
                // Start from 30% (after fetch) and use remaining 70% for processing
                const issueProgressPercentage = processedCount / totalIssues;
                const currentProgress = Math.round(
                  baseProgress +
                    progressPerBoard * (0.3 + 0.7 * issueProgressPercentage)
                );

                // Send progress message for every issue
                sendSSEMessage(controller, {
                  message: `Processing issues for ${board.name}\n${issue.key}\nCompleted: ${processedCount}/${totalIssues}`,
                  progress: currentProgress,
                  type: "info",
                  operation: `process-issues-${board.boardId}`,
                });

                try {
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
                    console.log(issueDetails);
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
                          // Store the original date string to preserve timezone
                          return history.created;
                        })
                    );

                    if (activityDates.size > 0) {
                      await prisma.projectActivity.createMany({
                        data: Array.from(activityDates).map(
                          (dateString: string) => {
                            // Create a date object that preserves the timezone
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

                  console.log(`[Issue ${issue.key}] Successfully processed`);
                  processedCount++;

                  // Send progress message for the last item
                  if (processedCount === totalIssues - 1) {
                    sendSSEMessage(controller, {
                      message: `Processing issues for ${board.name}\n${issue.key}\nCompleted: ${processedCount}/${totalIssues}`,
                      progress: currentProgress,
                      type: "info",
                      operation: `process-issues-${board.boardId}`,
                    });
                  }
                } catch (error) {
                  console.error(
                    `[Issue ${issue.key}] Error processing:`,
                    error
                  );
                  sendSSEMessage(controller, {
                    message: `Failed to process issue\n${issue.key}\nCompleted: ${processedCount}/${totalIssues}`,
                    progress: currentProgress,
                    type: "error",
                    operation: `process-issues-${board.boardId}`,
                  });
                  continue;
                }
              }

              // Send completion message for this board
              sendSSEMessage(controller, {
                message: `Completed processing ${board.name}\nAll ${totalIssues} issues processed`,
                progress: Math.round(baseProgress + progressPerBoard),
                type: "success",
                operation: `process-issues-${board.boardId}`,
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
