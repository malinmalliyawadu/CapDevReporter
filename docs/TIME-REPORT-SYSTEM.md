# Time Reporting System

This document explains the structure and flow of the time reporting system.

## System Overview

The time reporting system tracks employee time entries, leave records, and project activities. It allows filtering by team, role, and search terms, and calculates utilization metrics.

## Data Model

```mermaid
classDiagram
    class TimeReportParams {
        +Date from
        +Date to
        +string team
        +string role
        +string search
    }

    class TimeReportData {
        +TimeReport[] timeReports
        +Team[] teams
        +Role[] roles
        +TimeType[] timeTypes
        +GeneralTimeAssignment[] generalAssignments
    }

    class TimeReport {
        +string id
        +string employeeId
        +string employeeName
        +string week
        +string payrollId
        +number fullHours
        +number expectedHours
        +boolean isUnderutilized
        +number missingHours
        +string underutilizationReason
        +string team
        +string role
        +string roleId
        +string[] deviations
        +TimeReportEntry[] timeEntries
    }

    class TimeReportEntry {
        +string id
        +number hours
        +string timeTypeId
        +boolean isCapDev
        +boolean isLeave
        +string leaveType
        +string projectId
        +string projectName
        +string jiraId
        +string jiraUrl
        +boolean isPublicHoliday
        +string publicHolidayName
        +string date
        +string teamName
        +string activityDate
        +boolean isScheduled
        +string scheduledTimeTypeName
        +boolean isRolledUp
        +number rolledUpHoursPerWeek
    }

    class Employee {
        +string id
        +string name
        +string payrollId
        +number hoursPerWeek
        +Role role
        +Assignment[] assignments
    }

    class Assignment {
        +string id
        +string employeeId
        +string teamId
        +Date startDate
        +Date endDate
        +Team team
    }

    class Team {
        +string id
        +string name
        +string description
    }

    class Role {
        +string id
        +string name
        +string description
    }

    class TimeType {
        +string id
        +string name
        +string description
        +boolean isCapDev
        +string weeklySchedule
    }

    class Leave {
        +string id
        +string employeeId
        +Date date
        +number duration
        +string status
        +string type
    }

    TimeReportParams --> TimeReportData: used to fetch
    TimeReportData --> TimeReport: contains
    TimeReport --> TimeReportEntry: contains
    Employee --> Role: has
    Employee --> Assignment: has many
    Assignment --> Team: belongs to
    TimeReportEntry --> TimeType: references
```

## Process Flow

```mermaid
flowchart TD
    A[Start: Time Report Processing] --> K[Process each employee]
    K --> L[Process each week in date range]
    L --> M[Calculate expected hours based on employee contract]

    M --> N[Process each day in week]
    N --> O1{Is weekend?}
    O1 -->|Yes| P[Skip day - no hours expected]
    O1 -->|No| O2{Is public holiday?}

    O2 -->|Yes| Q[Add holiday entry]
    Q --> Q1[Mark as non-working day]
    Q1 --> Q2[Reduce expected hours]

    O2 -->|No| O3{Is employee on leave?}
    O3 -->|Yes| R[Add leave entry]
    R --> R1[Categorize by leave type]
    R1 --> R2[Apply leave hours to daily total]

    O3 -->|No| T[Check for scheduled assignments]
    T --> T1{Has weekly schedule?}
    T1 -->|Yes| T2[Apply scheduled time type]
    T1 -->|No| T3[Check for general assignments]

    T2 --> S[Check for remaining project activities]
    T3 --> S
    S --> S1[Retrieve Jira activities]
    S1 --> S2[Map activities to time types]
    S2 --> S3[Calculate project hours]

    P --> U[Calculate utilization metrics]
    Q2 --> U
    R2 --> U
    S3 --> U

    U --> U1[Sum actual hours]
    U1 --> U2[Compare with expected hours]
    U2 --> U3{Is underutilized?}
    U3 -->|Yes| U4[Flag underutilization]
    U3 -->|No| U5[Mark as fully utilized]

    U4 --> U6[Determine underutilization reason]
    U5 --> U7[Check for overtime]

    U6 --> V[Generate time report]
    U7 --> V
    V --> W[Apply deviations and adjustments]
    W --> X[Return final time report data]
```

## Key Functions

1. **getTimeReportData**: Main function that retrieves and processes time report data
2. **parseWeeklySchedule**: Parses the weekly schedule JSON from the database
3. **isDateOnScheduledDay**: Checks if a date falls on a scheduled day of the week

## Time Entry Sources

Time entries can come from multiple sources:

- Project activities tracked in Jira
- Leave records (vacation, sick leave, etc.)
- Public holidays
- General time assignments
- Scheduled assignments based on weekly schedules

The system aggregates all these sources to create a comprehensive view of how employees spend their time.
