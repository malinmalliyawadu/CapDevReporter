import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { JiraClient } from "@/lib/jira";

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        board: {
          include: {
            team: true,
          },
        },
        timeEntries: true,
      },
    });
    return NextResponse.json(projects);
  } catch (error) {
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
    return NextResponse.json(
      { error: "Failed to sync projects with Jira" },
      { status: 500 }
    );
  }
}
