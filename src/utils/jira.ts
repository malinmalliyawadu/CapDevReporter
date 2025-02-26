import JiraApi from "jira-client";

const validateJiraConfig = () => {
  if (
    !process.env.JIRA_HOST ||
    !process.env.JIRA_API_TOKEN ||
    !process.env.JIRA_USER_EMAIL
  ) {
    throw new Error(
      "Missing required Jira configuration in environment variables"
    );
  }
};

export const getJiraClient = () => {
  validateJiraConfig();

  return new JiraApi({
    protocol: "https",
    host: process.env.JIRA_HOST as string,
    username: process.env.JIRA_USER_EMAIL as string,
    password: process.env.JIRA_API_TOKEN as string,
    apiVersion: "3",
    strictSSL: true,
  });
};
