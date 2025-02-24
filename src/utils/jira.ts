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
