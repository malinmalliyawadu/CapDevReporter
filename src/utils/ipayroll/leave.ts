import {
  StoredToken,
  IPayrollPaginatedResponse,
  IPayrollLeaveRequest,
  IPayrollLeave,
} from "./types";
import { getIPayrollClient } from "./client";

// Fetch leave records from iPayroll API
export async function fetchLeaveRecords(
  token: StoredToken
): Promise<IPayrollLeave[]> {
  console.log("[iPayroll] Fetching leave records");
  try {
    const client = await getIPayrollClient(token);

    // Get current date and date 1 year ago for a reasonable date range
    const today = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Format dates as DD/MM/YYYY for iPayroll API
    const formatDate = (date: Date) => {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const dateFrom = formatDate(oneYearAgo);
    const dateTo = formatDate(today);

    console.log(
      `[iPayroll] Making request to /api/v1/leaves/requests endpoint with dateFrom=${dateFrom} and dateTo=${dateTo}`
    );

    const response = await client.get<
      IPayrollPaginatedResponse<IPayrollLeaveRequest>
    >(`/api/v1/leaves/requests?dateFrom=${dateFrom}&dateTo=${dateTo}`);

    console.log(
      `[iPayroll] Received ${
        response.data.content.length
      } leave requests from page ${response.data.page.number + 1} of ${
        response.data.page.totalPages
      }`
    );

    // Helper function to normalize leave duration to hours
    const normalizeDurationToHours = (record: IPayrollLeaveRequest): number => {
      // If the leave is recorded in days in iPayroll but we store as hours,
      // we need to convert (assuming standard 8-hour workday)
      if (record.leaveInDays === true) {
        console.log(
          `[iPayroll] Leave record ${record.id} is in days, converting to hours (8 hours per day)`
        );
        return record.hours * 8; // Convert days to hours assuming 8-hour workday
      }

      // Already in hours, return as is
      return record.hours;
    };

    // Map the response data to our internal format
    return response.data.content.map((leave): IPayrollLeave => {
      console.log(`[iPayroll] Processing leave request record: ${leave.id}`);

      // Get normalized duration in hours
      const durationInHours = normalizeDurationToHours(leave);
      console.log(
        `[iPayroll] Leave duration for record ${leave.id}: ${durationInHours} hours`
      );

      return {
        id: leave.id.toString(),
        employeeId: leave.employeeId,
        startDate: leave.leaveFromDate,
        endDate: leave.leaveToDate,
        type: leave.leaveBalanceType.name,
        status: leave.status,
        hours: durationInHours,
      };
    });
  } catch (error) {
    console.error("[iPayroll] Error fetching leave records:", error);
    throw error;
  }
}
