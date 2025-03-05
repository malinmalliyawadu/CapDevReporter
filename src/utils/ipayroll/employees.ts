import axios from "axios";
import {
  StoredToken,
  IPayrollPaginatedResponse,
  IPayrollRawEmployee,
  IPayrollEmployee,
} from "./types";
import { getIPayrollClient } from "./client";

// Fetch employees from iPayroll API
export async function fetchEmployees(
  token: StoredToken
): Promise<IPayrollEmployee[]> {
  console.log("[iPayroll] Fetching employees");
  try {
    const client = await getIPayrollClient(token);
    console.log("[iPayroll] Making request to /api/v1/employees endpoint");

    const response = await client.get<
      IPayrollPaginatedResponse<IPayrollRawEmployee>
    >("/api/v1/employees");

    console.log(
      `[iPayroll] Received ${
        response.data.content.length
      } employees from page ${response.data.page.number + 1} of ${
        response.data.page.totalPages
      }`
    );

    // Map the response data to our internal format
    return response.data.content.map((employee): IPayrollEmployee => {
      console.log(`[iPayroll] Processing employee: ${employee.id}`);
      return {
        id: employee.id,
        employeeId: employee.employeeId || "",
        firstName: employee.firstNames || "",
        lastName: employee.surname || "",
        status: employee.status || "Active",
        fullTimeHoursWeek: employee.fullTimeHoursWeek || 40,
        department: employee.userDefinedGroup || "",
        organisation: employee.organisation,
        title: employee.title || "", // Include the title
      };
    });
  } catch (error) {
    console.error("[iPayroll] Failed to fetch employees from iPayroll:", error);
    if (axios.isAxiosError(error)) {
      console.error("[iPayroll] Response status:", error.response?.status);
      console.error("[iPayroll] Response data:", error.response?.data);
      console.error("[iPayroll] Request config:", {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers,
      });
    }
    throw error;
  }
}
