import JiraApi from "jira-client";

if (
  !process.env.JIRA_HOST ||
  !process.env.JIRA_API_TOKEN ||
  !process.env.JIRA_USER_EMAIL
) {
  throw new Error(
    "Missing required Jira configuration in environment variables"
  );
}

export const jiraClient = new JiraApi({
  protocol: "https",
  host: process.env.JIRA_HOST,
  username: process.env.JIRA_USER_EMAIL,
  password: process.env.JIRA_API_TOKEN,
  apiVersion: "3",
  strictSSL: true,
});

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectCategory?: {
    id: string;
    name: string;
    description?: string;
  };
  simplified?: boolean;
  style?: string;
  isPrivate?: boolean;
}

export const isCapDevProject = (project: JiraProject): boolean => {
  // You can customize this logic based on your Jira setup
  // For example, checking project category, custom fields, or naming conventions
  return (
    project.projectCategory?.name === "CapDev" ||
    project.name.toLowerCase().includes("capdev")
  );
};
