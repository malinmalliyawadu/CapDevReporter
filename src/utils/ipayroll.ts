import axios from "axios";

if (
  !process.env.IPAYROLL_API_URL ||
  !process.env.IPAYROLL_API_KEY ||
  !process.env.IPAYROLL_COMPANY_ID
) {
  throw new Error(
    "Missing required iPayroll configuration in environment variables"
  );
}

const ipayrollClient = axios.create({
  baseURL: process.env.IPAYROLL_API_URL,
  headers: {
    Authorization: `Bearer ${process.env.IPAYROLL_API_KEY}`,
    "Content-Type": "application/json",
  },
});

interface IPayrollLeave {
  employeeId: string;
  date: string;
  type: string;
  status: string;
  duration: number;
}

export async function fetchLeaveRecords(): Promise<IPayrollLeave[]> {
  try {
    const response = await ipayrollClient.get(
      `/companies/${process.env.IPAYROLL_COMPANY_ID}/leave`
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return response.data.map((record: any) => ({
      employeeId: record.employeeId,
      date: record.date,
      type: record.leaveType,
      status: record.status.toUpperCase(),
      duration: record.durationDays,
    }));
  } catch (error) {
    console.error("Failed to fetch leave records from iPayroll:", error);
    throw error;
  }
}
