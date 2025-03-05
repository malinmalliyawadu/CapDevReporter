// OAuth 2.0 configuration
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationEndpoint: string;
  tokenEndpoint: string;
  scope: string;
}

// Token response from OAuth server
export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope?: string;
}

// Stored token with expiration
export interface StoredToken {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  tokenType: string;
}

// iPayroll API response interfaces
export interface IPayrollPaginatedResponse<T> {
  links: Array<{
    rel: string;
    href: string;
  }>;
  content: T[];
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

// iPayroll raw data interfaces (matching the API response)
export interface IPayrollRawEmployee {
  id: string;
  employeeId: string;
  surname: string;
  firstNames: string;
  status: string;
  fullTimeHoursWeek: number;
  userDefinedGroup?: string;
  organisation?: number;
  payFrequency?: string;
  lastModifiedDate?: string;
  title?: string; // Employee's title/role
  // Add other fields as needed
}

export interface IPayrollRawLeave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  leaveType: string;
  status: string;
  hours: number;
  // Add other fields as needed
}

// Our application's employee interface
export interface IPayrollEmployee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  status: string;
  fullTimeHoursWeek: number;
  department: string;
  organisation?: number;
  title?: string; // Employee's title/role
}

// Our application's leave interface
export interface IPayrollLeave {
  id: string;
  employeeId: string;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  hours: number;
}

// Define interface for the leave balances response
export interface IPayrollLeaveBalance {
  id: string;
  employeeId: string;
  entitled: number;
  accrued: number;
  taken: number;
  balance: number;
  committedEntitled: number;
  committedAccrued: number;
  committedTaken: number;
  committedBalance: number;
  leaveBalanceType: {
    leaveType: string;
    name: string;
    unit: string;
    organisationSpecific: boolean;
  };
  nextAnniversaryDate?: string;
  lastAnniversaryDate?: string;
  approvedQuantity?: number;
}

// Define interface for the leave requests response
export interface IPayrollLeaveRequest {
  id: number;
  employeeId: string;
  surname?: string;
  firstNames?: string;
  preferredName?: string;
  hours: number;
  leaveFromDate: string;
  leaveToDate: string;
  reason?: string;
  status: string;
  payElement?: string;
  leaveBalanceType: {
    leaveType: string;
    name: string;
    unit: string;
    organisationSpecific: boolean;
  };
  payElementId?: number;
  daysConsumed?: number;
  daysCurrent?: number;
  daysRemaining?: number;
  quantityConsumed?: number;
  quantityCurrent?: number;
  quantityRemaining?: number;
  leaveInDays?: boolean;
}
