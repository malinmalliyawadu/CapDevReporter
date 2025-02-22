import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JiraClient } from "@/lib/jira";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Number(searchParams.get("page")) || 1;
    const size = Number(searchParams.get("size")) || 10;
    const search = searchParams.get("search") || "";

    let where = {};

    if (search) {
      if (search.toLowerCase().startsWith("jira:")) {
        // Exact match for Jira ID
        const jiraId = search.slice(5); // Remove "jira:" prefix
        where = {
          jiraId: {
            equals: jiraId,
          },
        };
      } else {
        // Regular search across multiple fields
        const searchLower = search.toLowerCase();
        where = {
          OR: [
            { name: { contains: searchLower } },
            { description: { contains: searchLower } },
            { jiraId: { contains: searchLower } },
          ],
        };
      }
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: {
          board: {
            include: {
              team: true,
            },
          },
          timeEntries: true,
          activities: true,
        },
        orderBy: { name: "asc" },
        skip: (page - 1) * size,
        take: size,
      }),
      prisma.project.count({ where }),
    ]);

    return NextResponse.json({ projects, total });
  } catch (error) {
    console.error("Error fetching projects:", error);
    return NextResponse.json(
      { error: "Failed to fetch projects" },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const jiraClient = new JiraClient();
    const timestamp = new Date().toISOString();
    await jiraClient.syncProjects();

    return NextResponse.json({ timestamp });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Failed to sync projects with Jira" },
      { status: 500 }
    );
  }
}
