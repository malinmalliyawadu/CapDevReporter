import { prisma } from "@/lib/prisma";
import { jiraClient } from "@/utils/jira";

// Helper to send stream message
function sendStreamMessage(
  encoder: TextEncoder,
  controller: TransformStreamDefaultController,
  data: {
    message: string;
    progress: number;
    type?: "info" | "success" | "error" | "warning";
    operation: string;
  }
) {
  console.log(
    `[Stream] ${data.operation}: ${data.message} (Progress: ${data.progress}%)`
  );
  try {
    controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
  } catch (error) {
    console.error("[Stream] Failed to enqueue message:", error);
  }
}

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

export async function GET(request: Request) {
  console.log("[Sync] Starting sync process");

  // Parse the URL to get parameters
  const url = new URL(request.url);
  const issueKey = url.searchParams.get("issueKey");
  const selectedBoards = url.searchParams.get("boards")?.split(",") || ["all"];
  const maxIssuesPerBoard = parseInt(
    url.searchParams.get("maxIssuesPerBoard") || "50",
    10
  );

  console.log(
    `[Sync] Configuration - ${
      issueKey
        ? `Issue Key: ${issueKey}`
        : `Selected Boards: ${selectedBoards.join(
            ", "
          )}, Max Issues Per Board: ${maxIssuesPerBoard}`
    }`
  );

  // Create a transform stream to handle the sync process
  const encoder = new TextEncoder();
  let isStreamActive = true;

  const transform = new TransformStream({
    transform() {
      // We don't use the chunk as we're only using this for output
    },
    async start(controller) {
      let syncTimeout: NodeJS.Timeout | undefined;

      try {
        // Set a timeout to prevent infinite syncs
        const timeoutPromise = new Promise((_, reject) => {
          syncTimeout = setTimeout(() => {
            console.error("[Sync] Process timed out after 5 minutes");
            isStreamActive = false;
            reject(new Error("Sync timed out after 5 minutes"));
          }, 5 * 60 * 1000); // 5 minutes timeout
        });

        const syncPromise = async () => {
          try {
            if (isStreamActive) {
              sendStreamMessage(encoder, controller, {
                message: "Starting sync...",
                progress: 0,
                type: "info",
                operation: "sync-start",
              });
            }

            if (issueKey) {
              // Single issue sync mode
              sendStreamMessage(encoder, controller, {
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

                sendStreamMessage(encoder, controller, {
                  message: `Successfully synced issue ${issueKey}`,
                  progress: 100,
                  type: "success",
                  operation: "sync-issue",
                });

                // Send complete message
                controller.enqueue(
                  encoder.encode(
                    JSON.stringify({
                      type: "complete",
                      message: "Sync complete!",
                      progress: 100,
                    }) + "\n"
                  )
                );

                return;
              } catch (error: unknown) {
                console.error(`Error syncing issue ${issueKey}:`, error);
                sendStreamMessage(encoder, controller, {
                  message: `Failed to sync issue ${issueKey}: ${
                    error instanceof Error ? error.message : "Unknown error"
                  }`,
                  progress: 0,
                  type: "error",
                  operation: "sync-error",
                });
                throw error;
              }
            }

            // If no issue key, proceed with board-based sync
            // Get boards from database
            sendStreamMessage(encoder, controller, {
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
                sendStreamMessage(encoder, controller, {
                  message: "No boards found or could be created",
                  progress: 2,
                  type: "error",
                  operation: "fetch-boards",
                });
                throw new Error("No boards found or could be created");
              }
            }

            sendStreamMessage(encoder, controller, {
              message: `Successfully fetched ${boards.length} boards`,
              progress: 12,
              type: "success",
              operation: "fetch-boards",
            });

            // Get existing projects
            sendStreamMessage(encoder, controller, {
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

            sendStreamMessage(encoder, controller, {
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
                console.log("Found Jira board:", jiraBoard);

                if (!jiraBoard || !jiraBoard.location?.projectKey) {
                  console.error(
                    `[Board ${board.boardId}] Board not found in Jira response or missing project key`
                  );
                  sendStreamMessage(encoder, controller, {
                    message: `Board ${board.name} (${board.boardId}) not found in Jira or missing project key`,
                    progress: Math.round(baseProgress),
                    type: "error",
                    operation: "fetch-board",
                  });
                  continue;
                }

                console.log(
                  `[Board ${board.boardId}] Successfully found Jira board: ${jiraBoard.name} (ID: ${jiraBoard.id}) for project: ${jiraBoard.location.projectKey}`
                );
              } catch (error) {
                console.error(
                  `[Board ${board.boardId}] Error looking up board in Jira:`,
                  error
                );
                sendStreamMessage(encoder, controller, {
                  message: `Failed to lookup board ${board.name} in Jira`,
                  progress: Math.round(baseProgress),
                  type: "error",
                  operation: "fetch-board",
                });
                continue;
              }

              // Get issues for this board, prioritizing higher-level issues
              console.log(
                `[Board ${board.boardId}] Fetching issues for board ${board.name}`
              );
              sendStreamMessage(encoder, controller, {
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
                sendStreamMessage(encoder, controller, {
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
                sendStreamMessage(encoder, controller, {
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
                sendStreamMessage(encoder, controller, {
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
              sendStreamMessage(encoder, controller, {
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
                  sendStreamMessage(encoder, controller, {
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
                    ["summary", "description", "labels"],
                    "changelog"
                  );

                  console.log(
                    `[Issue ${issue.key}] Labels:`,
                    issueDetails.fields.labels
                  );

                  // Check if issue has capdev label
                  const isCapDev = await checkForCapDevLabel(issue.key);

                  console.log(`[Issue ${issue.key}] isCapDev:`, isCapDev);

                  // Update or create project
                  if (existingProjectMap.has(issueDetails.key)) {
                    console.log(
                      `[Issue ${issue.key}] Updating existing project with isCapDev=${isCapDev}`
                    );
                    await prisma.project.update({
                      where: { id: existingProjectMap.get(issueDetails.key) },
                      data: {
                        name: issueDetails.fields.summary,
                        description: issueDetails.fields.description || null,
                        isCapDev: isCapDev,
                        boardId: board.id,
                      },
                    });
                    console.log(
                      `[Issue ${issue.key}] Project updated successfully`
                    );
                  } else {
                    console.log(
                      `[Issue ${issue.key}] Creating new project with isCapDev=${isCapDev}`
                    );
                    await prisma.project.create({
                      data: {
                        name: issueDetails.fields.summary,
                        description: issueDetails.fields.description || null,
                        jiraId: issueDetails.key,
                        isCapDev: isCapDev,
                        boardId: board.id,
                      },
                    });
                    console.log(
                      `[Issue ${issue.key}] Project created successfully`
                    );
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

                  sendStreamMessage(encoder, controller, {
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
                  sendStreamMessage(encoder, controller, {
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

            sendStreamMessage(encoder, controller, {
              message: "Finalizing sync...",
              progress: 97,
              type: "info",
              operation: "finalize",
            });

            // At the end of successful sync
            if (isStreamActive) {
              sendStreamMessage(encoder, controller, {
                message: "Sync complete!",
                progress: 100,
                type: "success",
                operation: "finalize",
              });
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: "complete" }) + "\n")
              );
            }
          } catch (error) {
            if (isStreamActive) {
              console.error("[Sync] Error in sync process:", error);
              sendStreamMessage(encoder, controller, {
                message: `Error in sync process: ${
                  error instanceof Error ? error.message : "Unknown error"
                }`,
                progress: 100,
                type: "error",
                operation: "sync-error",
              });
              controller.enqueue(
                encoder.encode(JSON.stringify({ type: "complete" }) + "\n")
              );
            }
          } finally {
            isStreamActive = false;
            if (syncTimeout) {
              clearTimeout(syncTimeout);
            }
          }
        };

        // Race between sync and timeout
        await Promise.race([syncPromise(), timeoutPromise]);
      } catch (error) {
        if (isStreamActive) {
          console.error("[Sync] Error in sync route:", error);
          sendStreamMessage(encoder, controller, {
            message: `Error in sync route: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
            progress: 100,
            type: "error",
            operation: "sync-error",
          });
          controller.enqueue(
            encoder.encode(JSON.stringify({ type: "complete" }) + "\n")
          );
        }
      } finally {
        isStreamActive = false;
        if (syncTimeout) {
          clearTimeout(syncTimeout);
        }
      }
    },
    flush() {
      // Clean up when the stream is closed
      isStreamActive = false;
    },
  });

  return new Response(transform.readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
      Connection: "keep-alive",
    },
  });
}
