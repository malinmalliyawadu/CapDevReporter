# 🏗️ ***REMOVED*** Timesheet Architecture

This document outlines the architecture of the ***REMOVED*** Timesheet application, providing an overview of its components, data flow, and deployment strategy.

## 📊 System Overview

The ***REMOVED*** Timesheet application is a Next.js-based web application that allows ***REMOVED*** employees to track and manage their time entries. It integrates with iPayroll for payroll processing and Jira for project tracking.

```mermaid
graph TD
    User[User/Employee] -->|Accesses| WebApp[Web Application]
    WebApp -->|Authenticates| Auth[Authentication Service]
    WebApp -->|Manages Time| TimeEntry[Time Entry Service]
    WebApp -->|Views Reports| Reports[Reporting Service]
    TimeEntry -->|Stores Data| DB[(MySQL Database)]
    TimeEntry -->|Syncs With| iPayroll[iPayroll API]
    TimeEntry -->|Fetches Projects| Jira[Jira API]
    Reports -->|Reads Data| DB
```

## 🏢 Application Architecture

The application follows a modern Next.js architecture with the App Router pattern, leveraging server components and API routes.

```mermaid
graph TD
    subgraph "Frontend"
        Pages[Pages] --> Components[UI Components]
        Pages --> Hooks[Custom Hooks]
        Components --> Contexts[Context Providers]
    end

    subgraph "Backend"
        AppRouter[App Router] --> ServerComponents[Server Components]
        AppRouter --> APIRoutes[API Routes]
        ServerComponents --> Actions[Server Actions]
        APIRoutes --> Services[Services]
        Actions --> Services
    end

    subgraph "Data Layer"
        Services --> PrismaORM[Prisma ORM]
        PrismaORM --> Database[(MySQL Database)]
    end

    subgraph "External Services"
        Services --> iPayrollAPI[iPayroll API]
        Services --> JiraAPI[Jira API]
        Services --> AzureAD[Azure AD]
    end
```

## 📁 Directory Structure

The application follows a well-organized directory structure:

```
src/
├── app/                  # Next.js App Router pages and API routes
│   ├── actions/          # Server actions
│   ├── api/              # API endpoints
│   ├── login/            # Authentication pages
│   ├── reports/          # Reporting pages
│   └── ...               # Other page routes
├── components/           # Reusable UI components
├── contexts/             # React context providers
├── hooks/                # Custom React hooks
├── lib/                  # Core functionality and services
│   ├── auth.ts           # Authentication logic
│   ├── db.ts             # Database connection
│   ├── prisma.ts         # Prisma client
│   └── timeReportService.ts # Time reporting service
├── store/                # State management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## 🗄️ Data Model

The application uses a relational database with the following core entities:

```mermaid
erDiagram
    Team ||--o{ EmployeeAssignment : "has"
    Team ||--o{ JiraBoard : "manages"
    JiraBoard ||--o{ Project : "contains"
    Project ||--o{ ProjectActivity : "has"
    TimeType ||--o{ GeneralTimeAssignment : "used in"
    Role ||--o{ Employee : "assigned to"
    Employee ||--o{ EmployeeAssignment : "has"
    Employee ||--o{ TimeEntry : "logs"
    TimeEntry }|--|| TimeEntryType : "categorized as"
```

Key entities:

- **Team**: Represents departments or teams within the organization
- **Project**: Represents projects tracked in Jira
- **TimeType**: Categorizes different types of time entries (e.g., development, meetings)
- **Employee**: Represents users of the system
- **TimeEntry**: Records time spent on activities

## 🔄 Authentication Flow

The application uses Azure AD for authentication:

```mermaid
sequenceDiagram
    participant User
    participant App
    participant AzureAD
    participant Database

    User->>App: Access application
    App->>User: Redirect to login
    User->>AzureAD: Login with credentials
    AzureAD->>App: Return authentication token
    App->>Database: Verify/create user
    App->>User: Create session
    User->>App: Access protected resources
```

## 🚀 Deployment Architecture

```mermaid
graph TD
    LB[Load Balancer] --> ECS[ECS Cluster]
    ECS --> DB[(MySQL Database)]
    ECS --> iPayroll[iPayroll API]
    ECS --> Jira[Jira API]
    ECS --> AzureAD[Azure AD]
```

## 🔄 CI/CD Pipeline

```mermaid
graph LR
    Code[Code Changes] --> GithubActions[GitHub Actions]
    GithubActions --> Build[Build & Test]
    Build --> Deploy[Deploy to Environment]
    Deploy --> Prod[Production]
```

## 🧪 Testing Strategy

The application employs a comprehensive testing strategy:

```mermaid
graph TD
    subgraph "Testing Layers"
        Unit[Unit Tests] --> Integration[Integration Tests]
        Integration --> E2E[E2E Tests]
    end

    subgraph "Testing Tools"
        Jest[Jest] --> Unit
        Playwright[Playwright] --> E2E
    end
```

## 🔐 Security Considerations

- Authentication via Azure AD (including MFA)
- Sensitive environment variables stored in Secrets Manager
- HTTPS for all communications
- Database access restricted to application
- Data encryption at rest via RDS
- iPayroll and Jira API logging
